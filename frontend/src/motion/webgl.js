import * as THREE from 'three'

// Creates a transparent WebGL renderer, or returns null when WebGL is
// unavailable so the page keeps its plain CSS background.
export function createRenderer() {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    return renderer
  } catch (err) {
    console.warn('[motion] WebGL unavailable, using CSS fallback:', err.message)
    return null
  }
}

// Runs `frame(elapsedSeconds, deltaSeconds)` on every animation frame, pausing
// while the tab is hidden. Returns a stop function.
export function startLoop(renderer, frame) {
  const clock = new THREE.Clock()
  const run = () => {
    const delta = Math.min(clock.getDelta(), 0.05)
    frame(clock.elapsedTime, delta)
  }
  const onVisibility = () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null)
      clock.stop()
    } else {
      clock.start()
      renderer.setAnimationLoop(run)
    }
  }
  renderer.setAnimationLoop(run)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    renderer.setAnimationLoop(null)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

// Frees every geometry/material in the scene plus the renderer itself.
export function disposeScene(scene, renderer) {
  scene.traverse((obj) => {
    obj.geometry?.dispose()
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    materials.forEach((m) => m?.dispose())
  })
  renderer.dispose()
  renderer.domElement.remove()
}

// Shared GLSL: smooth flowing height field used by both scenes' point grids.
export const waveGLSL = /* glsl */ `
  float wave(vec2 p, float t) {
    float h = sin(p.x * 0.35 + t * 0.6) * 0.55;
    h += sin(p.y * 0.55 - t * 0.45 + p.x * 0.15) * 0.35;
    h += sin((p.x + p.y) * 0.9 + t * 0.9) * 0.12;
    return h;
  }
`
