import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from './motionPrefs'

gsap.registerPlugin(ScrollTrigger)

// Elements that must keep native wheel/touch scrolling: Monaco, modal
// overlays, and any panel with its own vertical scrollbar.
function isNativeScrollArea(node) {
  if (node.closest('.monaco-editor, [role="dialog"]')) return true
  const style = getComputedStyle(node)
  if (style.position === 'fixed' && !node.classList.contains('sidebar')) return true
  return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight
}

// Inertia smooth scrolling for the window, driven by GSAP's ticker so
// ScrollTrigger animations stay in sync. Jumps to the top on route change.
export function useSmoothScroll(routeKey) {
  const lenisRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return undefined
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, prevent: isNativeScrollArea })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    lenisRef.current = lenis
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [routeKey])
}
