import { useLayoutEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import logoUrl from '../assets/atlas-logo.jpg'
import { prefersReducedMotion } from '../motion/motionPrefs'

const COLS = 8
const ROWS = 5
const LABEL = 'ATLAS — Algorithmic Trading Lab and Analysis System'

// Deterministic random so the shard pattern is identical on every visit.
function seededRandom(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// Cuts the logo into triangular shards: a jittered vertex grid, each cell
// split along a diagonal. Coordinates are percentages of the logo box.
function buildShards() {
  const rand = seededRandom(2024)
  const vertices = []
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const edge = r === 0 || c === 0 || r === ROWS || c === COLS
      const jx = edge ? 0 : (rand() - 0.5) * 0.6
      const jy = edge ? 0 : (rand() - 0.5) * 0.6
      vertices.push([((c + jx) / COLS) * 100, ((r + jy) / ROWS) * 100])
    }
  }
  const v = (r, c) => vertices[r * (COLS + 1) + c]

  const shards = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const [a, b, cc, d] = [v(r, c), v(r, c + 1), v(r + 1, c + 1), v(r + 1, c)]
      const tris = (r + c) % 2 === 0 ? [[a, b, cc], [a, cc, d]] : [[a, b, d], [b, cc, d]]
      for (const tri of tris) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
        shards.push({
          clip: `polygon(${tri.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`,
          cx,
          cy,
          // Outward direction from the logo centre, used for the scatter.
          dx: cx - 50,
          dy: cy - 50,
          spin: (rand() - 0.5) * 220,
          scale: 0.35 + rand() * 0.45,
          reach: 1.4 + rand() * 1.6,
        })
      }
    }
  }
  return shards
}

/**
 * The ATLAS logo, assembled from flying shards on first render. Falls back to
 * the static image when reduced motion is requested.
 */
export default function AtlasLogo({ className = '', delay = 0.4 }) {
  const rootRef = useRef(null)
  const shards = useMemo(buildShards, [])
  const reduced = prefersReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return undefined
    const root = rootRef.current
    let tl
    let cancelled = false

    const ctx = gsap.context(() => {
      const pieces = gsap.utils.toArray('.atlas-shard')
      const box = root.getBoundingClientRect()
      const unitX = box.width / 100
      const unitY = box.height / 100

      gsap.set('.atlas-logo-full', { opacity: 0 })
      gsap.set(pieces, {
        opacity: 0,
        x: (i) => shards[i].dx * shards[i].reach * unitX * 1.6,
        y: (i) => shards[i].dy * shards[i].reach * unitY * 2.2,
        rotation: (i) => shards[i].spin,
        scale: (i) => shards[i].scale,
      })

      const start = () => {
        if (cancelled) return
        tl = gsap.timeline({ delay })
        // Centre shards land first, the outer ring follows.
        tl.to(pieces, {
          opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
          duration: 1.5,
          ease: 'expo.out',
          stagger: (i) => (Math.hypot(shards[i].dx, shards[i].dy) / 70) * 0.7,
        })
        // Swap the seamed shards for the single crisp image, then flash.
        tl.to('.atlas-logo-full', { opacity: 1, duration: 0.35, ease: 'power1.out' }, '-=0.25')
        tl.set(pieces, { display: 'none' })
        tl.add(() => root.classList.add('is-assembled'), '-=0.2')
      }

      // Wait for the image so shards never fly in empty.
      const img = new Image()
      img.src = logoUrl
      img.decode().then(start, start)
    }, root)

    return () => {
      cancelled = true
      tl?.kill()
      ctx.revert()
      root.classList.remove('is-assembled')
    }
  }, [reduced, shards, delay])

  return (
    <div ref={rootRef} className={`atlas-logo ${reduced ? 'is-assembled' : ''} ${className}`}>
      {!reduced && shards.map((s, i) => (
        <span
          key={i}
          className="atlas-shard"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${logoUrl})`,
            clipPath: s.clip,
            transformOrigin: `${s.cx}% ${s.cy}%`,
          }}
        />
      ))}
      <img className="atlas-logo-full" src={logoUrl} alt={LABEL} draggable="false" />
      <span className="atlas-logo-sheen" aria-hidden="true" />
    </div>
  )
}
