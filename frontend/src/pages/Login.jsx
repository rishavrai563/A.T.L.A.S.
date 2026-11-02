import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { registerUser, loginUser } from '../api/auth'
import { prefersReducedMotion } from '../motion/motionPrefs'
import AtlasLogo from '../components/AtlasLogo'
import AtlasMark from '../components/AtlasMark'

const LoginScene = lazy(() => import('../components/LoginScene'))

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)
  const formRef = useRef(null)

  // Card entrance: the panel rises in, then its content cascades.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        // fromTo with explicit end values: elements with a CSS `transition`
        // would otherwise report mid-transition values as the target.
        .fromTo(cardRef.current, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1, clearProps: 'all' }, 0.2)
        // The logo runs its own shard assembly, so it is left out here.
        .fromTo('.login-left-content > :not(.atlas-logo), .login-right-content > *',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, clearProps: 'opacity,transform' }, 1.1)
    }, cardRef)
    return () => ctx.revert()
  }, [])

  // Fields slide in when switching between Sign In and Sign Up.
  const firstRender = useRef(true)
  useLayoutEffect(() => {
    if (firstRender.current) { firstRender.current = false; return undefined }
    if (prefersReducedMotion()) return undefined
    const ctx = gsap.context(() => {
      gsap.fromTo('.login-field, .login-submit-btn',
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'opacity,transform' })
    }, formRef)
    return () => ctx.revert()
  }, [mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Name is required.'); setLoading(false); return }
        if (!email.trim()) { setError('Email is required.'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }
        onLogin(await registerUser(name, email, password))
      } else {
        if (!email.trim() || !password.trim()) { setError('Email and password are required.'); setLoading(false); return }
        onLogin(await loginUser(email, password))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* WebGL market terrain; the CSS gradient shows until it loads */}
      <Suspense fallback={null}>
        <LoginScene />
      </Suspense>

      <div className="login-container" ref={cardRef}>
        {/* Left Panel — Welcome */}
        <div className="login-left">
          <div className="login-left-content">
            {/* Logo assembles from flying shards on load */}
            <AtlasLogo delay={0.55} />

            <h1 className="login-welcome">
              Welcome to <span className="login-welcome-highlight">ATLAS</span>
            </h1>
            <p className="login-tagline">Build, backtest and understand trading strategies on real market data.</p>
            <p className="login-subtitle">
              {mode === 'login' 
                ? "Don't have an account yet?"
                : 'Already have an account?'
              }
            </p>
            <button 
              className="login-switch-btn"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>

            <div className="login-float-icons">
              <div className="float-icon fi-1" title="Analytics">📊</div>
              <div className="float-icon fi-2" title="Trades">💹</div>
              <div className="float-icon fi-3" title="Secure sessions">🔒</div>
              <div className="float-icon fi-4" title="Fast execution">⚡</div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="login-right">
          <div className="login-right-content">
            <div className="login-right-header">
              <div className="login-logo-sm">
                <AtlasMark size={28} />
                <span>ATLAS</span>
              </div>
            </div>

            <h2 className="login-form-title">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>

            <form onSubmit={handleSubmit} className="login-form" ref={formRef}>
              {mode === 'register' && (
                <div className="login-field">
                  <label>Full Name <span className="required">*</span></label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">👤</span>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      aria-label="Full name"
                    />
                  </div>
                </div>
              )}

              <div className="login-field">
                <label>Login or email <span className="required">*</span></label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">👤</span>
                  <input
                    type="email"
                    placeholder="Enter your login or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    aria-label="Email address"
                  />
                </div>
              </div>

              <div className="login-field">
                <label>
                  Password <span className="required">*</span>
                  <span className="login-hint">(must contain at least 6 symbols)</span>
                </label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner" aria-hidden="true" />Please wait...</>
                  : mode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>

              <p className="login-terms">
                By clicking "{mode === 'login' ? 'Sign In' : 'Sign Up'}" button, you agree to our{' '}
                <a href="#terms">Terms of Use</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
