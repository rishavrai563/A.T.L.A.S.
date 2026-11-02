import { lazy, Suspense, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useApp } from '../App'
import ThemeToggle from './ThemeToggle'
import AtlasMark from './AtlasMark'
import { useSmoothScroll } from '../motion/useSmoothScroll'
import { useScrollReveal } from '../motion/useScrollReveal'

// three.js is loaded in its own chunk so it never delays the first paint.
const AmbientBackground = lazy(() => import('./AmbientBackground'))

const links = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/strategy', label: 'Strategy Builder', icon: '◇' },
  { to: '/parameters', label: 'Parameters', icon: '◒' },
  { to: '/results', label: 'Backtest Results', icon: '▥' },
  { to: '/explore', label: 'Explore', icon: '↔' },
  { to: '/compare', label: 'Compare', icon: '⇄' },
  { to: '/documentation', label: 'Documentation', icon: '📖' },
  { to: '/profile', label: 'Profile', icon: '◉' },
]

export default function Layout({ children }) {
  const { user, handleLogout } = useApp()
  const userName = user?.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const { pathname } = useLocation()
  const pageRef = useRef(null)
  useSmoothScroll(pathname)
  useScrollReveal(pageRef, pathname)

  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>
      <aside className="sidebar">
        <div className="brand">
          <AtlasMark size={38} className="brand-mark" />
          <div>
            <strong>ATLAS</strong>
            <span>Trading Lab</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-item">
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} aria-label="Sign out">
            ⏻ Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
  <div className="topbar-left">
    <ThemeToggle />
    <div className="breadcrumbs">
      Algorithmic Trading Lab and Analysis System
    </div>
  </div>

  <Link to="/profile" className="user-chip" style={{ textDecoration: 'none', color: 'inherit' }}>
    <span className="avatar">{userInitial}</span>
    {userName}
  </Link>
  {/* Re-keyed per route so the sweep replays on every navigation */}
  <span key={pathname} className="route-progress" aria-hidden="true" />
</header>
        <div className="page-area" ref={pageRef}>{children}</div>
      </main>
    </div>
  )
}
