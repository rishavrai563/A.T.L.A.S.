import { useId, useLayoutEffect, useRef, useState } from 'react'

const PAD = { top: 18, right: 16, bottom: 28, left: 52 }
const TICKS = 4

const defaultFormat = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })
const compactFormat = (v) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

// Monotone cubic interpolation: smooth like a spline, but never overshoots
// the real data, so peaks and troughs stay honest.
function smoothPath(pts) {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`
  const dx = [], m = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0] || 1e-6
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]
  }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0
      ? 0
      : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i])
  }
  t[n - 1] = m[n - 2]

  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const c = dx[i] / 3
    d += `C${(x0 + c).toFixed(1)},${(y0 + t[i] * c).toFixed(1)} ${(x1 - c).toFixed(1)},${(y1 - t[i + 1] * c).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  return d
}

// Up to `count` evenly spaced, non-empty, non-repeating x-axis labels.
function axisLabels(data, count) {
  const picked = []
  for (let k = 0; k < count; k++) {
    const target = Math.round((k / (count - 1)) * (data.length - 1))
    let i = target
    while (i < data.length && !data[i]?.label) i++
    if (i >= data.length) continue
    const label = String(data[i].label)
    if (picked.some((p) => p.label === label)) continue
    picked.push({ index: target, label })
  }
  return picked
}

/**
 * Line chart for equity / drawdown curves.
 * `data` is [{ label, value }]. Pass `compare` to overlay a second series on
 * the same scale. `tone="negative"` renders a drawdown-style chart filled
 * down from zero.
 */
export default function Sparkline({
  data,
  compare,
  height = 220,
  tone = 'auto',
  labels = ['Strategy', 'Comparison'],
  formatValue = defaultFormat,
  formatTick = compactFormat,
  ariaLabel = 'Equity curve chart',
}) {
  const gradientId = `lc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const stageRef = useRef(null)
  const [width, setWidth] = useState(760)
  const [hover, setHover] = useState(null)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    setWidth(Math.max(240, el.clientWidth))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keep the measured stage mounted so width is known once data arrives.
  if (!data?.length) return <div className="chart-wrap"><div className="lc-stage" ref={stageRef} /></div>

  const hasCompare = Boolean(compare?.length)
  const values = [...data, ...(hasCompare ? compare : [])].map((d) => d.value).filter(Number.isFinite)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.08
  const min = rawMin - pad
  const max = rawMax <= 0 && tone === 'negative' ? 0 : rawMax + pad

  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const x = (i, len) => PAD.left + (len <= 1 ? innerW / 2 : (i / (len - 1)) * innerW)
  const y = (v) => PAD.top + (1 - (v - min) / (max - min || 1)) * innerH
  const toPoints = (series) => series.map((d, i) => [x(i, series.length), y(d.value)])

  const mainPts = toPoints(data)
  const mainPath = smoothPath(mainPts)
  const comparePath = hasCompare ? smoothPath(toPoints(compare)) : ''

  const color = tone === 'negative' ? 'var(--loss)' : 'var(--chart-1)'
  const compareColor = 'var(--chart-2)'
  const negative = tone === 'negative'
  const baseY = negative ? y(max) : PAD.top + innerH
  const last = mainPts[mainPts.length - 1]
  const areaPath = `${mainPath}L${last[0].toFixed(1)},${baseY}L${mainPts[0][0].toFixed(1)},${baseY}Z`

  const ticks = Array.from({ length: TICKS }, (_, k) => min + ((max - min) * k) / (TICKS - 1))
  const xLabels = axisLabels(data, 5)

  // Hover / keyboard crosshair
  const compareIndex = (i) => Math.round((i / Math.max(1, data.length - 1)) * (compare.length - 1))
  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, i)))
  }
  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (step) {
      e.preventDefault()
      setHover((h) => Math.min(data.length - 1, Math.max(0, (h ?? (step > 0 ? -1 : data.length)) + step)))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setHover(e.key === 'Home' ? 0 : data.length - 1)
    } else if (e.key === 'Escape') {
      setHover(null)
    }
  }

  const hp = hover !== null ? data[hover] : null
  const hx = hover !== null ? x(hover, data.length) : 0
  const cp = hover !== null && hasCompare ? compare[compareIndex(hover)] : null
  const summary = `${ariaLabel}: ${labels[0]} from ${formatValue(data[0].value)} to ${formatValue(data[data.length - 1].value)}. Use left and right arrow keys to inspect points.`

  return (
    <div className="chart-wrap">
      <div className="lc-stage" ref={stageRef}>
        <svg
          className="chart-svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={summary}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: negative ? 0.02 : 0.32 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: negative ? 0.3 : 0 }} />
            </linearGradient>
          </defs>

          {ticks.map((v, k) => (
            <g key={k}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className={k === 0 ? 'lc-baseline' : 'lc-gridline'} />
              <text x={PAD.left - 10} y={y(v) + 3} textAnchor="end" className="lc-tick">{formatTick(v)}</text>
            </g>
          ))}
          {xLabels.map(({ index, label }) => (
            <text key={label} x={x(index, data.length)} y={height - 6} textAnchor="middle" className="lc-tick">{label}</text>
          ))}

          <path d={areaPath} fill={`url(#${gradientId})`} className="lc-area" />
          {hasCompare && <path d={comparePath} className="lc-stroke secondary" style={{ stroke: compareColor }} />}
          <path d={mainPath} className="lc-glow" style={{ stroke: color }} />
          <path d={mainPath} pathLength="1" className="lc-stroke lc-draw" style={{ stroke: color }} />

          <g className="lc-end">
            <circle cx={last[0]} cy={last[1]} r="4" className="lc-pulse" style={{ fill: color }} />
            <circle cx={last[0]} cy={last[1]} r="4" className="lc-hover-dot" style={{ fill: color }} />
          </g>

          {hp && (
            <g aria-hidden="true">
              <line x1={hx} x2={hx} y1={PAD.top} y2={PAD.top + innerH} className="lc-cursor" />
              {cp && <circle cx={hx} cy={y(cp.value)} r="4.5" className="lc-hover-dot" style={{ fill: compareColor }} />}
              <circle cx={hx} cy={y(hp.value)} r="5" className="lc-hover-dot" style={{ fill: color }} />
            </g>
          )}
        </svg>

        {hp && (
          <div
            className="lc-tip"
            style={{ left: `${Math.min(Math.max((hx / width) * 100, 12), 88)}%`, top: `${y(cp ? Math.max(hp.value, cp.value) : hp.value)}px` }}
            aria-hidden="true"
          >
            {hp.label && <span>{hp.label}</span>}
            <div className="tip-row">
              {hasCompare && <i className="tip-swatch" style={{ background: color }} />}
              <strong>{formatValue(hp.value)}</strong>
            </div>
            {cp && (
              <div className="tip-row">
                <i className="tip-swatch" style={{ background: compareColor }} />
                <strong>{formatValue(cp.value)}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {hasCompare && (
        <div className="legend">
          <span><i className="legend-line main" /> {labels[0]}</span>
          <span><i className="legend-line bench" /> {labels[1]}</span>
        </div>
      )}
    </div>
  )
}
