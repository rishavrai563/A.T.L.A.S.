import { useId } from 'react'

/**
 * Compact ATLAS emblem (ring + stylised "A" with the rising green wedge) for
 * the sidebar, form header and favicon, where the full logo is too detailed.
 */
export default function AtlasMark({ size = 36, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14e0c4" />
          <stop offset="55%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="#060d19" />
      <circle cx="32" cy="32" r="27" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="3" />
      <path d="M32 12 L51 50 H42.5 L32 28.5 L21.5 50 H13 Z" fill={`url(#${id}-metal)`} />
      <path d="M17.5 50 L31 37 L36.5 43 Z" fill="#22c55e" />
    </svg>
  )
}
