import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { createRenderer, startLoop, disposeScene, waveGLSL } from '../motion/webgl'
import { prefersReducedMotion } from '../motion/motionPrefs'

const CANDLE_COUNT = 22
const CAMERA_HOME = new THREE.Vector3(0, 5.2, 14)
const LOOK_AT = new THREE.Vector3(0, 1.2, 0)

// Deterministic random so the price curve looks the same on every visit.
function seededRandom(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function buildPricePoints() {
  const rand = seededRandom(1014)
  const points = []
  let y = 0.6
  for (let i = 0; i <= 48; i++) {
    y += (rand() - 0.42) * 0.42
    points.push(new THREE.Vector3(-15 + i * (30 / 48), 1.6 + y * 0.9 + i * 0.035, -2.5))
  }
  return points
}

function createTerrain(pixelRatio) {
  const geometry = new THREE.PlaneGeometry(40, 22, 200, 110)
  geometry.rotateX(-Math.PI / 2)

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uPixelRatio: { value: pixelRatio },
      uLow: { value: new THREE.Color('#4f46e5') },
      uHigh: { value: new THREE.Color('#38bdf8') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uPixelRatio;
      varying float vHeight;
      varying float vFade;
      ${waveGLSL}
      void main() {
        vec3 p = position;
        float h = wave(p.xz, uTime);
        float d = distance(p.xz, uMouse);
        h += exp(-d * d * 0.06) * sin(d * 1.8 - uTime * 3.2) * 0.7;
        p.y += h;
        vHeight = h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(2.0 + h, 0.6) * uPixelRatio * (11.0 / -mv.z);
        vFade = 1.0 - smoothstep(7.0, 34.0, -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLow;
      uniform vec3 uHigh;
      varying float vHeight;
      varying float vFade;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 color = mix(uLow, uHigh, smoothstep(-0.8, 0.9, vHeight));
        gl_FragColor = vec4(color, (1.0 - smoothstep(0.0, 0.5, r)) * vFade * 0.85);
      }
    `,
  })

  return new THREE.Points(geometry, material)
}

function createPriceLine(curve) {
  const group = new THREE.Group()
  const core = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 480, 0.045, 8, false),
    new THREE.MeshBasicMaterial({ color: '#7dd3fc' }),
  )
  const glow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 480, 0.18, 8, false),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#e0f2fe' }),
  )
  group.add(glow, core, head)

  // Reveals the line from left to right; `progress` is 0..1.
  const setProgress = (progress) => {
    for (const mesh of [core, glow]) {
      const total = mesh.geometry.index.count
      mesh.geometry.setDrawRange(0, Math.floor(total * progress))
    }
    head.position.copy(curve.getPointAt(Math.max(progress, 0.001)))
    head.visible = progress > 0.01 && progress < 0.999
  }
  return { group, setProgress }
}

function createCandles(curve) {
  const rand = seededRandom(42)
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 1, 0.32),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }),
    CANDLE_COUNT,
  )
  // Instances are spread along the curve, far from the base box's bounds.
  mesh.frustumCulled = false
  const candles = []
  const green = new THREE.Color('#22c55e')
  const red = new THREE.Color('#ef4444')
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const t = (i + 0.5) / CANDLE_COUNT
    const anchor = curve.getPointAt(t)
    const up = rand() > 0.38
    candles.push({ t, anchor, height: 0.35 + rand() * 0.9, phase: rand() * Math.PI * 2, offsetZ: 1.4 })
    mesh.setColorAt(i, up ? green : red)
  }

  const dummy = new THREE.Object3D()
  // Candles grow in once the price line has passed them, then bob gently.
  const update = (time, progress) => {
    candles.forEach((c, i) => {
      const grown = THREE.MathUtils.smoothstep(progress, c.t - 0.02, c.t + 0.06)
      dummy.position.set(c.anchor.x, c.anchor.y - 1.1 + Math.sin(time * 0.9 + c.phase) * 0.08, c.anchor.z + c.offsetZ)
      dummy.scale.set(1, Math.max(c.height * grown, 0.0001), 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  return { mesh, update }
}

export default function LoginScene() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const renderer = createRenderer()
    if (!host || !renderer) return undefined
    host.appendChild(renderer.domElement)

    const reduced = prefersReducedMotion()
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#090d16', 14, 34)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.copy(CAMERA_HOME)
    if (!reduced) camera.position.z = 24
    camera.lookAt(LOOK_AT)

    const terrain = createTerrain(renderer.getPixelRatio())
    terrain.position.y = -1.6
    const curve = new THREE.CatmullRomCurve3(buildPricePoints())
    const priceLine = createPriceLine(curve)
    const candles = createCandles(curve)
    scene.add(terrain, priceLine.group, candles.mesh)

    const state = { progress: reduced ? 1 : 0 }
    const pointer = new THREE.Vector2(0, 0)
    const smoothPointer = new THREE.Vector2(0, 0)
    const raycaster = new THREE.Raycaster()
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.6)
    const hit = new THREE.Vector3()

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
      if (reduced) render(0)
    }

    const render = (time) => {
      terrain.material.uniforms.uTime.value = time
      priceLine.setProgress(state.progress)
      candles.update(time, state.progress)
      renderer.render(scene, camera)
    }

    const onPointerMove = (e) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    let stopLoop = () => {}
    const tweens = []
    if (reduced) {
      render(0)
    } else {
      window.addEventListener('pointermove', onPointerMove)
      tweens.push(
        gsap.to(camera.position, { z: CAMERA_HOME.z, duration: 2.8, ease: 'power3.out' }),
        gsap.to(state, { progress: 1, duration: 3.2, delay: 0.4, ease: 'power2.inOut' }),
      )
      stopLoop = startLoop(renderer, (time) => {
        smoothPointer.lerp(pointer, 0.05)
        camera.position.x = CAMERA_HOME.x + smoothPointer.x * 1.4
        camera.position.y = CAMERA_HOME.y + smoothPointer.y * 0.7
        camera.lookAt(LOOK_AT)

        raycaster.setFromCamera(smoothPointer, camera)
        if (raycaster.ray.intersectPlane(ground, hit)) {
          terrain.material.uniforms.uMouse.value.set(hit.x, hit.z)
        }
        render(time)
      })
    }

    return () => {
      stopLoop()
      tweens.forEach((t) => t.kill())
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      disposeScene(scene, renderer)
    }
  }, [])

  return <div ref={hostRef} className="login-scene" aria-hidden="true" />
}
