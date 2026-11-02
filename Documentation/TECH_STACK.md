# Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React 19 + JSX | Interactive user interface |
| Vite | Development server and build |
| React Router | Page navigation |
| Monaco Editor (`@monaco-editor/react`) | Python strategy code editor |
| lightweight-charts | Candlestick price chart with trade markers |
| Custom SVG | Equity, drawdown and comparison line charts |
| Three.js | WebGL login scene and ambient background |
| GSAP + Lenis | Scroll reveals, entrance animations, smooth scrolling |
| CSS (design tokens) | Light/dark theming and all styling |

## Backend

| Technology | Purpose |
|---|---|
| C# / ASP.NET Core (.NET 8) | REST API |
| Entity Framework Core + SQLite | Users, sessions, strategies and backtest history |
| PBKDF2-SHA256 | Password hashing |
| QuantConnect LEAN (Docker) | Historical backtesting engine |
| Yahoo Finance / Upstox | Historical market data sources |

## Data and visualization

| Component | Purpose |
|---|---|
| Historical market data | Input for backtesting |
| Chart components | Price, equity, drawdown and comparison views |
| Trade/result data | Performance and comparison views |

## Development tools

| Tool | Purpose |
|---|---|
| Git / GitHub | Version control and collaboration |
| VS Code or similar IDE | Development |
| Docker Desktop | Runs the LEAN container |
