import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createRenderer, startLoop, disposeScene, waveGLSL } from '../motion/webgl'
import { prefersReducedMotion, isDarkTheme, observeTheme } from '../motion/motionPrefs'

// Palette per theme: light mode needs normal blending (additive vanishes on
// a white page), dark mode glows with additive blending.
const THEMES = {
  light: { low: '#93c5fd', high: '#2563eb', opacity: 0.32, blending: THREE.NormalBlending },
  dark: { low: '#4f46e5', high: '#38bdf8', opacity: 0.5, blending: THREE.AdditiveBlending },
}

function createWaveField(pixelRatio) {
  const geometry = new THREE.PlaneGeometry(60, 30, 150, 75)
  geometry.rotateX(-Math.PI / 2)

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 0.3 },
      uLow: { value: new THREE.Color() },
      uHigh: { value: new THREE.Color() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScroll;
      uniform float uEnergy;
      uniform float uPixelRatio;
      varying float vHeight;
      varying float vFade;
      ${waveGLSL}
      void main() {
        vec3 p = position;
        vec2 flow = p.xz + vec2(0.0, uScroll);
        float h = wave(flow, uTime * 0.6) * (1.0 + uEnergy);
        p.y += h;
        vHeight = h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 1.8 * uPixelRatio * (12.0 / -mv.z);
        vFade = 1.0 - smoothstep(10.0, 40.0, -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform float uOpacity;
      varying float vHeight;
      varying float vFade;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        vec3 color = mix(uLow, uHigh, smoothstep(-0.8, 0.9, vHeight));
        gl_FragColor = vec4(color, (1.0 - smoothstep(0.1, 0.5, r)) * vFade * uOpacity);
      }
    `,
  })

  return new THREE.Points(geometry, material)
}

export default function AmbientBackground() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const renderer = createRenderer()
    if (!host || !renderer) return undefined
    host.appendChild(renderer.domElement)

    const reduced = prefersReducedMotion()
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 3.2, 12)
    camera.lookAt(0, 0, -4)

    const field = createWaveField(renderer.getPixelRatio())
    field.position.y = -3
    scene.add(field)
    const uniforms = field.material.uniforms

    const render = (time = 0) => {
      uniforms.uTime.value = time
      renderer.render(scene, camera)
    }

    const applyTheme = (dark) => {
      const theme = dark ? THEMES.dark : THEMES.light
      uniforms.uLow.value.set(theme.low)
      uniforms.uHigh.value.set(theme.high)
      uniforms.uOpacity.value = theme.opacity
      field.material.blending = theme.blending
      field.material.needsUpdate = true
      if (reduced) render()
    }

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1)
      camera.updateProjectionMatrix()
      if (reduced) render()
    }

    applyTheme(isDarkTheme())
    resize()
    window.addEventListener('resize', resize)
    const stopThemeWatch = observeTheme(applyTheme)

    let stopLoop = () => {}
    if (!reduced) {
      // Scrolling pushes the wave forward; fast scrolling briefly swells it.
      let lastScroll = window.scrollY
      let energy = 0
      stopLoop = startLoop(renderer, (time, delta) => {
        const scroll = window.scrollY
        const velocity = Math.abs(scroll - lastScroll) / Math.max(delta, 0.001)
        lastScroll = scroll
        energy += (Math.min(velocity / 4000, 0.6) - energy) * 0.06
        uniforms.uScroll.value += ((scroll * 0.004) - uniforms.uScroll.value) * 0.08
        uniforms.uEnergy.value = energy
        render(time)
      })
    }

    return () => {
      stopLoop()
      stopThemeWatch()
      window.removeEventListener('resize', resize)
      disposeScene(scene, renderer)
    }
  }, [])

  return <div ref={hostRef} className="ambient-bg" aria-hidden="true" />
}
