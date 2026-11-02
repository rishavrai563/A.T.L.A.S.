// Shared helpers for the motion layer (WebGL scenes, smooth scroll, reveals).

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

export function isDarkTheme() {
  return document.documentElement.dataset.theme === 'dark'
}

// Calls `callback(isDark)` whenever ThemeToggle flips html[data-theme].
export function observeTheme(callback) {
  const observer = new MutationObserver(() => callback(isDarkTheme()))
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
