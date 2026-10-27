import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useApp } from '../App'
import { runBacktest, getJobStatus } from '../api/backtest'
import { recordBacktest } from '../api/strategies'
import { prefersReducedMotion } from '../motion/motionPrefs'

// Pipeline stages, each active until job progress reaches `until`.
const STAGES = [
  { label: 'Submitting job', detail: 'Sending strategy code and config to the API', until: 10 },
  { label: 'Loading market data', detail: 'Fetching and validating historical bars', until: 35 },
  { label: 'Running LEAN engine', detail: 'Simulating every bar inside Docker', until: 90 },
  { label: 'Parsing results', detail: 'Computing metrics, trades and equity curve', until: 100 },
]

// Fixed bar heights for the candlestick animation inside the ring.
const CANDLES = [0.55, 0.8, 0.45, 0.7, 1, 0.6, 0.85, 0.5, 0.95, 0.65, 0.75, 0.9]

const RING_R = 118
const RING_C = 2 * Math.PI * RING_R

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function LoadingBacktest() {
  const navigate = useNavigate()
  const { strategy, strategyCode, setBacktestResults, setBacktestError, setRunHistory, activeStrategyId, refreshData } = useApp()
  const [status, setStatus] = useState('Submitting backtest request...')
  const [progress, setProgress] = useState(0)
  const [shownProgress, setShownProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const hasRun = useRef(false)
  const shownRef = useRef(0)

  // Count the displayed percentage up smoothly toward the real progress.
  useEffect(() => {
    const target = Math.max(5, progress)
    if (prefersReducedMotion()) {
      shownRef.current = target
      setShownProgress(target)
      return undefined
    }
    const counter = { value: shownRef.current }
    const tween = gsap.to(counter, {
      value: target, duration: 0.8, ease: 'power2.out',
      onUpdate: () => {
        shownRef.current = counter.value
        setShownProgress(counter.value)
      },
    })
    return () => tween.kill()
  }, [progress])

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const execute = async () => {
      try {
        setBacktestError(null)
        
        const parameters = {}
        for (const [key, value] of Object.entries(strategy)) {
          if (!['name', 'asset', 'timeframe', 'startDate', 'endDate'].includes(key)) {
            if (key === 'buyThreshold') parameters['oversold'] = String(value)
            else if (key === 'sellThreshold') parameters['overbought'] = String(value)
            else parameters[key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()] = String(value)
          }
        }

        const config = {
          asset: strategy.asset,
          resolution: strategy.timeframe,
          startDate: strategy.startDate,
          endDate: strategy.endDate,
          startingCash: 100000,
          parameters: parameters
        }

        const { jobId } = await runBacktest(strategyCode, config)

        const pollInterval = setInterval(async () => {
          try {
            const jobInfo = await getJobStatus(jobId)
            
            if (jobInfo.isComplete) {
              clearInterval(pollInterval)
              const result = jobInfo.result
              
              if (result.success) {
                setStatus('Results parsed successfully!')
                setProgress(100)
                setBacktestResults(result)
                
                // Add to run history
                setRunHistory(prev => {
                  const newRun = {
                    id: Date.now(),
                    name: `Run ${prev.length + 1}`,
                    config,
                    strategyConfig: { ...strategy },
                    metrics: result.metrics || {},
                    equityCurve: result.equityCurve || [],
                  };
                  return [...prev, newRun];
                })

                // Record to backend for persistence
                if (activeStrategyId) {
                  const m = result.metrics || {}
                  recordBacktest(activeStrategyId, {
                    strategyName: strategy.name,
                    asset: strategy.asset,
                    period: `${strategy.startDate} → ${strategy.endDate}`,
                    totalReturn: m.totalReturn || 0,
                    maxDrawdown: m.maxDrawdown || 0,
                    totalTrades: m.totalTrades || 0,
                    winRate: m.winRate || 0,
                    startEquity: m.startEquity || 100000,
                    endEquity: m.endEquity || 100000,
                    parameterValues: Object.fromEntries(
                      Object.entries(strategy)
                        .filter(([k]) => !['name','asset','timeframe','startDate','endDate'].includes(k))
                        .filter(([, v]) => typeof v === 'number')
                    ),
                  })
                    .then(() => refreshData())
                    .catch(err => console.warn('Failed to record backtest:', err))
                }

                navigate('/results')
              } else {
                setBacktestError(result.errorMessage || 'Execution failed')
                setBacktestResults(result)
                navigate('/results')
              }
            } else {
              setStatus(jobInfo.status)
              setProgress(jobInfo.progress)
            }
          } catch (err) {
            clearInterval(pollInterval)
            setBacktestError(err.message)
            navigate('/results')
          }
        }, 500)

      } catch (err) {
        setBacktestError(err.message)
        navigate('/results')
      }
    }

    execute()
  }, [strategy, strategyCode, navigate, setBacktestResults, setBacktestError])

  const pct = Math.round(shownProgress)
  const activeStage = progress >= 100 ? STAGES.length : STAGES.findIndex((s) => progress < s.until)

  return (
    <section className="center-page">
      <div className="bt-loader panel">
        <div className="bt-visual" aria-hidden="true">
          <svg className="bt-ring" viewBox="0 0 260 260">
            <defs>
              <linearGradient id="bt-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--accent-2)' }} />
              </linearGradient>
            </defs>
            <g className="bt-ring-ticks">
              {Array.from({ length: 60 }, (_, i) => {
                const a = (i / 60) * Math.PI * 2
                const r1 = i % 5 === 0 ? 100 : 104
                return <line key={i} x1={130 + Math.cos(a) * r1} y1={130 + Math.sin(a) * r1} x2={130 + Math.cos(a) * 107} y2={130 + Math.sin(a) * 107} />
              })}
            </g>
            <circle className="bt-ring-track" cx="130" cy="130" r={RING_R} />
            <circle
              className="bt-ring-progress"
              cx="130" cy="130" r={RING_R}
              stroke="url(#bt-ring-grad)"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - shownProgress / 100)}
            />
            <circle className="bt-ring-orbit" cx="130" cy="130" r="126" strokeDasharray={`40 ${2 * Math.PI * 126 - 40}`} />
          </svg>

          <div className="bt-percent">
            <strong>{pct}%</strong>
            <span>Complete</span>
          </div>
          <div className="bt-candles">
            {CANDLES.map((h, i) => (
              <i
                key={i}
                className={`bt-candle ${i % 3 === 2 ? 'down' : ''}`}
                style={{ '--i': i, height: `${h * 52}px`, '--lo': 0.35 + (i % 4) * 0.1 }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow">Backtests / Running</div>
          <h1>Running Backtest</h1>
          <p>Fetching historical data and executing your strategy in LEAN.</p>

          <ol className="bt-stages">
            {STAGES.map((stage, i) => {
              const state = i < activeStage ? 'done' : i === activeStage ? 'active' : 'pending'
              return (
                <li key={stage.label} className={`bt-stage ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                  <span className="bt-stage-icon" aria-hidden="true">{state === 'done' ? '✓' : state === 'pending' ? i + 1 : ''}</span>
                  <div>
                    <strong>{stage.label}</strong>
                    <small>{stage.detail}</small>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${shownProgress}%` }} />
          </div>

          <div className="bt-status" role="status" aria-live="polite">
            <span className="bt-status-text">{status}</span>
            <span className="bt-elapsed" aria-label={`Elapsed time ${formatElapsed(elapsed)}`}>⏱ {formatElapsed(elapsed)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
