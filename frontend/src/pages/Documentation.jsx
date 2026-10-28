import { useState } from 'react'
import DocTooltip from '../components/DocTooltip'

const sections = [
  {
    id: 'platform',
    title: 'About ATLAS',
    icon: '🏠',
    content: [
      {
        heading: 'What is ATLAS?',
        body: `ATLAS (Algorithmic Trading Lab and Analysis System) is a human-centered algorithmic trading visualization platform designed for traders, researchers, and students. It provides an intuitive interface to create, backtest, explore, and compare quantitative trading strategies — all without needing to manage infrastructure or write boilerplate code.

The platform bridges the gap between complex quantitative finance tools and everyday usability by focusing on clear visualizations, contextual explanations, and an accessible design that makes algorithmic trading comprehensible to users of all experience levels.`
      },
      {
        heading: 'Key Features',
        items: [
          { term: 'Strategy Builder', desc: 'Create strategies using a Monaco code editor with Python syntax highlighting, live linting, or a drag-and-drop Visual Blocks editor — no coding required.' },
          { term: 'Parameter Tuning', desc: 'Adjust strategy parameters using interactive sliders with real-time estimated previews before running an actual backtest.' },
          { term: 'One-Click Backtesting', desc: 'Execute strategies against historical market data powered by QuantConnect LEAN engine running in Docker containers.' },
          { term: 'Rich Visualizations', desc: 'Interactive equity curves, drawdown profiles, candlestick charts with trade markers, and detailed trade logs.' },
          { term: 'Strategy Comparison', desc: 'Side-by-side comparison of multiple backtest runs with highlighted parameter differences and metric delta analysis.' },
          { term: 'Portfolio Dashboard', desc: 'Track your holdings, view order history, monitor portfolio performance, and analyze winning strategies.' },
          { term: 'Dark Mode', desc: 'Full dark theme support with WCAG AA–compliant contrast ratios for comfortable extended use.' },
          { term: 'Accessibility', desc: 'Keyboard navigation, ARIA labels, focus-visible indicators, and screen reader support built into every component.' },
        ]
      },
      {
        heading: 'Architecture Overview',
        body: `The platform uses a modern three-tier architecture:

• Frontend: React 18 + Vite, with Chart.js/Recharts for visualizations and Monaco Editor for code editing.
• Backend: ASP.NET Core (C#) REST API handling strategy storage, parameter management, and backtest orchestration.
• Engine: QuantConnect LEAN — an open-source algorithmic trading engine — runs inside Docker containers for isolated, reproducible backtests.

When you click "Run Backtest," the backend injects your parameters into the Python strategy template, creates a LEAN configuration, launches a Docker container, and streams the results back to your browser.`
      }
    ]
  },
  {
    id: 'lean',
    title: 'LEAN Algorithmic Trading Engine',
    icon: '⚙️',
    content: [
      {
        heading: 'What is LEAN?',
        body: `LEAN is an open-source algorithmic trading engine developed by QuantConnect. It is used by thousands of quant traders and institutions worldwide to research, backtest, and deploy trading strategies.

LEAN supports multiple asset classes (equities, forex, crypto, futures, options), multiple programming languages (Python, C#), and provides institutional-grade features like slippage modeling, transaction cost simulation, and multi-asset portfolio management.`
      },
      {
        heading: 'How LEAN Works in Our Platform',
        body: `Here's the step-by-step flow when you run a backtest:

1. Strategy Code: You write or configure a Python strategy using our Strategy Builder. The code extends QCAlgorithm, LEAN's base class.

2. Parameter Injection: The backend reads your parameter values (RSI period, thresholds, etc.) and injects them into the Python code as self.AddParameter() calls.

3. Configuration Generation: A config.json file is generated with your settings — asset symbol, date range, resolution, starting capital — and mounted into a Docker volume.

4. Docker Execution: LEAN runs inside a Docker container (quantconnect/lean:latest). The container reads your strategy and config, downloads historical data, and executes the simulation.

5. Result Parsing: Our LeanResultParser extracts metrics (total return, drawdown, Sharpe ratio, trade log) from LEAN's output files and sends them to the frontend.

6. Visualization: Results are rendered as interactive charts, metric cards, and comparison tables in your browser.`
      },
      {
        heading: 'LEAN Strategy Structure',
        code: `class MyStrategy(QCAlgorithm):
    def initialize(self):
        # Set backtest dates and starting capital
        self.set_start_date(2024, 1, 1)
        self.set_end_date(2024, 12, 31)
        self.set_cash(100000)
        
        # Add the asset to trade
        self.add_equity("AAPL", Resolution.DAILY)
        
        # Create technical indicators
        self.rsi = self.RSI("AAPL", 14)
        
    def on_data(self, data):
        # Trading logic runs on each new data point
        if self.rsi.current.value < 30:
            self.set_holdings("AAPL", 1.0)  # Buy
        elif self.rsi.current.value > 70:
            self.liquidate("AAPL")           # Sell`
      },
      {
        heading: 'Supported Features',
        items: [
          { term: 'Multi-Asset', desc: 'Trade equities, ETFs, forex pairs, and cryptocurrencies in a single strategy.' },
          { term: 'Technical Indicators', desc: 'Built-in support for 100+ indicators: SMA, EMA, RSI, MACD, Bollinger Bands, and more.' },
          { term: 'Event-Driven', desc: 'Strategies react to market data events (OnData), scheduled events, and order fill events.' },
          { term: 'Realistic Simulation', desc: 'Models slippage, commissions, market impact, and partial fills for accurate results.' },
          { term: 'Docker Isolation', desc: 'Each backtest runs in its own container, ensuring reproducibility and security.' },
        ]
      }
    ]
  },
  {
    id: 'terms',
    title: 'Financial Terms Glossary',
    icon: '📚',
    content: [
      {
        heading: 'Core Trading Concepts',
        glossary: [
          { term: 'Backtest', def: 'A simulation that runs a trading strategy against historical market data to evaluate how it would have performed. Unlike live trading, backtests are risk-free and allow you to test ideas before committing capital.' },
          { term: 'Strategy', def: 'A set of rules that define when to buy and sell assets. Strategies can be based on technical indicators (like RSI or moving averages), fundamental data, or statistical models.' },
          { term: 'Equity Curve', def: 'A line chart showing how your portfolio value changes over time during a backtest. An upward-sloping equity curve indicates profitable performance; a flat or declining curve suggests the strategy needs improvement.' },
          { term: 'Trade', def: 'A single buy or sell action executed by your strategy. Each trade records the timestamp, price, quantity, and direction (buy/sell).' },
        ]
      },
      {
        heading: 'Performance Metrics',
        glossary: [
          { term: 'Total Return', def: 'The overall percentage gain or loss of your portfolio from start to finish. Calculated as: ((End Value - Start Value) / Start Value) × 100. A +15% return means your ₹100,000 became ₹115,000.' },
          { term: 'Maximum Drawdown', def: 'The largest peak-to-trough decline in your portfolio value during the backtest period. It measures the worst-case loss you would have experienced. A drawdown of -12% means at its worst point, the portfolio dropped 12% from its highest value.' },
          { term: 'Win Rate', def: 'The percentage of profitable trades out of total trades. A win rate of 58% means 58 out of every 100 trades were profitable. Note: a low win rate can still be profitable if winning trades are much larger than losing ones.' },
          { term: 'Sharpe Ratio', def: 'A measure of risk-adjusted return. It tells you how much excess return you earn per unit of risk (volatility). A Sharpe ratio above 1.0 is generally considered good; above 2.0 is excellent.' },
          { term: 'Profit Factor', def: 'The ratio of gross profits to gross losses. A profit factor of 1.5 means you made ₹1.50 for every ₹1.00 lost. Values above 1.0 indicate a profitable strategy.' },
          { term: 'Alpha', def: 'The excess return of your strategy compared to a benchmark index (e.g., NIFTY 50). Positive alpha means your strategy outperformed the market; negative alpha means it underperformed.' },
          { term: 'Beta', def: 'A measure of how much your strategy\'s returns move with the overall market. A beta of 1.0 means it moves exactly with the market; less than 1.0 means it\'s less volatile; more than 1.0 means more volatile.' },
        ]
      },
      {
        heading: 'Technical Indicators',
        glossary: [
          { term: 'RSI (Relative Strength Index)', def: 'A momentum oscillator ranging from 0 to 100. Values below 30 suggest the asset is "oversold" (potentially undervalued), and values above 70 suggest it is "overbought" (potentially overvalued). Traders often buy when RSI drops below 30 and sell when it rises above 70.' },
          { term: 'SMA (Simple Moving Average)', def: 'The average closing price over a specific number of periods. For example, a 20-day SMA is the average of the last 20 closing prices. When a short-term SMA crosses above a long-term SMA, it generates a "golden cross" buy signal.' },
          { term: 'EMA (Exponential Moving Average)', def: 'Similar to SMA but gives more weight to recent prices, making it more responsive to new information. The 12-day and 26-day EMAs are commonly used in the MACD indicator.' },
          { term: 'MACD (Moving Average Convergence Divergence)', def: 'A trend-following momentum indicator calculated as the difference between a 12-period EMA and a 26-period EMA. A signal line (9-period EMA of MACD) is used to generate buy/sell signals.' },
          { term: 'Bollinger Bands', def: 'Three lines plotted 2 standard deviations above and below a 20-period SMA. When price touches the upper band, the asset may be overbought; when it touches the lower band, it may be oversold.' },
        ]
      },
      {
        heading: 'Strategy Parameters',
        glossary: [
          { term: 'RSI Period', def: 'The number of price bars used to calculate the RSI indicator. A shorter period (e.g., 7) makes RSI more sensitive to price changes; a longer period (e.g., 21) makes it smoother and less reactive.' },
          { term: 'Buy Threshold (Oversold)', def: 'The RSI level below which the strategy considers an asset oversold and triggers a buy signal. Default is 30. Lower values mean fewer but potentially more accurate buy signals.' },
          { term: 'Sell Threshold (Overbought)', def: 'The RSI level above which the strategy considers an asset overbought and triggers a sell signal. Default is 70. Higher values mean fewer but potentially more accurate sell signals.' },
          { term: 'Fast MA Period', def: 'The number of bars for the shorter moving average in a crossover strategy. Smaller values make it react faster to price changes but generate more false signals.' },
          { term: 'Slow MA Period', def: 'The number of bars for the longer moving average. It provides the trend baseline. The difference between fast and slow periods determines signal sensitivity.' },
          { term: 'Stop Loss', def: 'A predetermined price level at which a losing position is automatically closed to limit losses. A 5% stop loss means the trade is exited if the price drops 5% from entry.' },
          { term: 'Take Profit', def: 'A predetermined price level at which a winning position is automatically closed to lock in gains. A 10% take profit means the trade is exited when the price rises 10% from entry.' },
          { term: 'Resolution', def: 'The time interval of each price bar. "Daily" means one bar per trading day; "30 Min" means one bar every 30 minutes. Higher resolution provides more data points but increases computation time.' },
        ]
      }
    ]
  }
]

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('platform')
  const current = sections.find(s => s.id === activeSection)

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Learn</div>
          <h1>Documentation</h1>
          <p>Everything you need to know about the platform, LEAN engine, and financial concepts.</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="docs-tabs">
        {sections.map(s => (
          <button
            key={s.id}
            className={`docs-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            <span className="docs-tab-icon">{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      {/* Content */}
      {current && current.content.map((block, idx) => (
        <section key={idx} className="panel docs-panel">
          <h2 className="docs-heading">{block.heading}</h2>

          {block.body && (
            <div className="docs-body">
              {block.body.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {block.code && (
            <pre className="docs-code"><code>{block.code}</code></pre>
          )}

          {block.items && (
            <div className="docs-features">
              {block.items.map((item, i) => (
                <div key={i} className="docs-feature-card">
                  <h4>{item.term}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {block.glossary && (
            <div className="docs-glossary">
              {block.glossary.map((entry, i) => (
                <div key={i} className="docs-glossary-item">
                  <dt>
                    <DocTooltip termKey={entry.term.toLowerCase().split(' ')[0]}>
                      {entry.term}
                    </DocTooltip>
                  </dt>
                  <dd>{entry.def}</dd>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
