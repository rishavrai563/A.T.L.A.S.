import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from './motionPrefs'

gsap.registerPlugin(ScrollTrigger)

// Top-level blocks of every page. Direct children only, so nested cards
// never animate twice.
const REVEAL_SELECTOR = '.page-stack > *, .profile > *'

// Fades and lifts page sections as they scroll into view. Opacity is used
// instead of visibility so unrevealed content stays in the tab order.
export function useScrollReveal(containerRef, routeKey) {
  // Layout effect: hide new sections before the first paint, avoiding a flash.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || prefersReducedMotion()) return undefined

    const tracked = new Set()
    const triggers = []
    let frame = 0

    const show = (els) => gsap.to(els, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true,
      clearProps: 'opacity,transform',
    })

    const scan = () => {
      frame = 0
      const fresh = [...container.querySelectorAll(REVEAL_SELECTOR)].filter((el) =>
        !tracked.has(el) && getComputedStyle(el).position !== 'fixed')
      if (!fresh.length) return
      fresh.forEach((el) => tracked.add(el))
      gsap.set(fresh, { opacity: 0, y: 28 })
      triggers.push(...ScrollTrigger.batch(fresh, { start: 'top 94%', once: true, onEnter: show }))
      ScrollTrigger.refresh()
    }

    // Keyboard users tabbing ahead of the scroll position see content at once.
    const onFocusIn = (e) => {
      const block = [...tracked].find((el) => el.contains(e.target))
      if (block && Number(gsap.getProperty(block, 'opacity')) < 1) show([block])
    }

    scan()
    // Pages render more sections once backend data arrives.
    const observer = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(scan) })
    observer.observe(container, { childList: true, subtree: true })
    container.addEventListener('focusin', onFocusIn)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      container.removeEventListener('focusin', onFocusIn)
      triggers.forEach((t) => t.kill())
      if (!tracked.size) return
      gsap.killTweensOf([...tracked])
      gsap.set([...tracked], { clearProps: 'opacity,transform' })
    }
  }, [containerRef, routeKey])
}
