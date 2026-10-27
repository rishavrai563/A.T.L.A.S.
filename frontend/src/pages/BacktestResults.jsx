import { useState, Component } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import MetricCard from '../components/MetricCard'
import Sparkline from '../components/Sparkline'
import CandlestickChart from '../components/CandlestickChart'
import DocTooltip from '../components/DocTooltip'

// Error boundary to catch render crashes and display them instead of a blank page
class ResultsErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('BacktestResults render crash:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-stack">
          <div className="panel" style={{ padding: '40px' }}>
            <h2 className="error-title">Rendering Error</h2>
            <p>The results page crashed while rendering. This usually means the backend returned data in an unexpected format.</p>
            <pre className="error-pre">
              {this.state.error?.toString()}
            </pre>
            <button className="button primary" onClick={() => window.location.href = '/strategy'} style={{ marginTop: '16px' }}>
              ← Back to Strategy
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function BacktestResultsInner() {
  const navigate = useNavigate()
  const { strategy, backtestResults, backtestError } = useApp()
  const [selectedTrade, setSelectedTrade] = useState(null)

  // Debug: log what we received
  console.log('[BacktestResults] backtestError:', backtestError)
  console.log('[BacktestResults] backtestResults:', backtestResults)

  if (backtestError) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <div><div className="eyebrow">Step 3 of 3</div><h1>Backtest Failed</h1></div>
          <button className="button secondary" onClick={() => navigate('/strategy')}>← Edit Strategy</button>
        </div>
        <div className="panel">
          <div className="section-title"><h2>Error Details</h2></div>
          <p className="error-lead">LEAN Engine encountered an error:</p>
          <pre className="error-pre">
            {backtestError}
          </pre>
          {backtestResults?.leanLogs && (
            <>
              <h3 style={{ marginTop: '20px' }}>Full LEAN Logs</h3>
              <pre className="log-pre">
                {backtestResults.leanLogs}
              </pre>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!backtestResults) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <div><div className="eyebrow">Step 3 of 3</div><h1>No Results Yet</h1></div>
          <button className="button primary" onClick={() => navigate('/strategy')}>Run Backtest →</button>
        </div>
      </div>
    )
  }

  // Safe destructuring with defaults
  const metrics = backtestResults.metrics || {}
  const equityCurve = backtestResults.equityCurve || []
  const trades = backtestResults.trades || []
  const ohlcData = backtestResults.ohlcData || []

  const totalReturn = metrics.totalReturn ?? 0
  const maxDrawdown = metrics.maxDrawdown ?? 0
  const totalTrades = metrics.totalTrades ?? 0
  const winRate = metrics.winRate ?? 0
  const startEquity = metrics.startEquity ?? 100000
  const endEquity = metrics.endEquity ?? 0

  // Format equity curve for Sparkline
  const formattedCurve = equityCurve.map(pt => ({
    label: new Date((pt.timestamp || 0) * 1000).toLocaleDateString(),
    value: pt.equity || 0
  }))

  // Calculate drawdown curve
  let peak = -Infinity
  const drawdownCurve = equityCurve.map(pt => {
    const eq = pt.equity || 0
    if (eq > peak) peak = eq
    const dd = peak === 0 ? 0 : ((eq - peak) / peak) * 100
    return {
      label: new Date((pt.timestamp || 0) * 1000).toLocaleDateString(),
      value: dd
    }
  })

  const tradeList = trades

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Step 3 of 3</div>
          <h1>Backtest Results</h1>
          <p>{strategy?.name || 'Strategy'} · {strategy?.asset || 'Asset'} · {strategy?.startDate || '?'} to {strategy?.endDate || '?'}</p>
          <div className="param-chips">
            {Object.entries(strategy || {})
              .filter(([k]) => !['name', 'asset', 'timeframe', 'startDate', 'endDate'].includes(k))
              .map(([k, v]) => (
                <span key={k} className="param-chip">
                  {k}: {v}
                </span>
            ))}
          </div>
        </div>
        <button className="button secondary" onClick={() => navigate('/explore')}>Explore Parameters</button>
      </div>

      <div className="metric-grid">
        <MetricCard label={<DocTooltip termKey="return">Return</DocTooltip>} value={`${totalReturn > 0 ? '+' : ''}${totalReturn.toFixed(2)}%`} tone={totalReturn >= 0 ? "positive" : "negative"} />
        <MetricCard label={<DocTooltip termKey="drawdown">Max Drawdown</DocTooltip>} value={`${maxDrawdown.toFixed(2)}%`} tone="negative" />
        <MetricCard label={<DocTooltip termKey="trades">Total Trades</DocTooltip>} value={totalTrades} />
        <MetricCard label={<DocTooltip termKey="winRate">Win Rate</DocTooltip>} value={`${winRate.toFixed(2)}%`} />
        <MetricCard label="Final Equity" value={`₹${endEquity.toLocaleString()}`} />
      </div>

      <section className="panel chart-panel">
        <div className="section-title">
          <div>
            <h2>Price & Trades</h2>
            <span className="muted">Click on a BUY or SELL marker on the chart to see trade details.</span>
          </div>
        </div>

        {selectedTrade && (
          <div className={`trade-popover ${selectedTrade.direction === 'Buy' ? 'buy' : 'sell'}`} key={selectedTrade.orderId}>
            <div className="trade-popover-head">
              <strong className={selectedTrade.direction === 'Buy' ? 'buy-text' : 'sell-text'}>{selectedTrade.direction} Order #{selectedTrade.orderId}</strong>
              <button className="icon-btn" onClick={() => setSelectedTrade(null)} aria-label="Close trade details">✕</button>
            </div>
            <dl className="trade-popover-grid">
              <dt>Date</dt>
              <dd>{new Date(selectedTrade.time).toLocaleString()}</dd>
              <dt>Price</dt>
              <dd>₹{(selectedTrade.price || 0).toLocaleString()}</dd>
              <dt>Quantity</dt>
              <dd>{selectedTrade.quantity}</dd>
            </dl>
          </div>
        )}

        {ohlcData.length > 0 ? (
           <CandlestickChart data={ohlcData} trades={tradeList} onTradeClick={setSelectedTrade} height={400} />
        ) : (
           <p className="muted" style={{ padding: '40px', textAlign: 'center' }}>No price data available.</p>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <h2><DocTooltip termKey="equityCurve">Equity Curve</DocTooltip></h2>
            <span className="muted">Portfolio Value (Start: ₹{startEquity.toLocaleString()})</span>
          </div>
        </div>
        {formattedCurve.length > 0 ? (
           <Sparkline
             data={formattedCurve}
             height={260}
             labels={['Portfolio value']}
             ariaLabel="Equity curve"
             formatValue={(v) => `₹${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
           />
        ) : (
           <p className="muted" style={{ padding: '40px', textAlign: 'center' }}>No equity data available.</p>
        )}
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="section-title">
            <div>
              <h2><DocTooltip termKey="drawdownProfile">Drawdown Profile</DocTooltip></h2>
              <span className="muted">Peak-to-trough risk ({maxDrawdown.toFixed(2)}% max)</span>
            </div>
          </div>
          {drawdownCurve.length > 0 ? (
             <Sparkline
               data={drawdownCurve}
               height={190}
               tone="negative"
               labels={['Drawdown']}
               ariaLabel="Drawdown profile"
               formatValue={(v) => `${v.toFixed(2)}%`}
               formatTick={(v) => `${v.toFixed(0)}%`}
             />
          ) : (
             <p className="muted" style={{ padding: '40px', textAlign: 'center' }}>No drawdown data available.</p>
          )}
        </section>

        <section className="panel">
          <div className="section-title"><h2>Recent Trades</h2><button className="text-button" onClick={() => { document.getElementById('trades')?.scrollIntoView(); }}>View All</button></div>
          <div className="mini-list">
            {tradeList.length === 0 && <p className="muted">No trades executed.</p>}
            {tradeList.slice(-5).reverse().map((t, idx) => (
              <div className="mini-row" key={t.orderId || idx} style={{ cursor: 'pointer' }} tabIndex="0" role="button" onClick={() => { setSelectedTrade(t); window.scrollTo({ top: 150, behavior: 'smooth' }) }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTrade(t); window.scrollTo({ top: 150, behavior: 'smooth' }) } }}>
                <span>{new Date(t.time).toLocaleDateString()}</span>
                <strong className={t.direction === 'Buy' ? 'buy-text' : 'sell-text'}>{t.direction}</strong>
                <span>₹{(t.price || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div id="trades" className="panel">
        <div className="section-title"><h2>All Trades</h2></div>
        <div className="table-wrap">
          {tradeList.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {tradeList.map((t, idx) => (
                  <tr key={t.orderId || idx} tabIndex="0" role="row" onClick={() => { setSelectedTrade(t); window.scrollTo({ top: 150, behavior: 'smooth' }) }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTrade(t); window.scrollTo({ top: 150, behavior: 'smooth' }) } }} style={{ cursor: 'pointer' }} className="hover-row">
                    <td>{t.orderId}</td>
                    <td>{new Date(t.time).toLocaleString()}</td>
                    <td><span className={t.direction === 'Buy' ? 'buy-text' : 'sell-text'}>{t.direction}</span></td>
                    <td>₹{(t.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{t.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No trade history to display.</p>
          )}
        </div>
      </div>

      <div className="bottom-actions">
        <button className="button secondary" onClick={() => navigate('/parameters')}>← Change Parameters</button>
        <button className="button primary" onClick={() => navigate('/compare')}>Compare Strategies →</button>
      </div>
    </div>
  )
}

export default function BacktestResults() {
  return (
    <ResultsErrorBoundary>
      <BacktestResultsInner />
    </ResultsErrorBoundary>
  )
}
