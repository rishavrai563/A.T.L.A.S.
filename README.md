# ATLAS — Algorithmic Trading Lab and Analysis System

A human-centered web application for building, backtesting, exploring and comparing algorithmic trading strategies on historical market data, with a visual interface on top of the QuantConnect LEAN engine.

**Workflow:** Create Strategy → Configure Parameters → Run Backtest → View Results → Explore Variations → Compare Strategies

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Using the platform](#using-the-platform)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Backend API](#backend-api)
- [Configuration](#configuration)
- [Build](#build)
- [Troubleshooting](#troubleshooting)
- [Team and disclaimer](#team-members)

## Features

| Area | What it does |
|---|---|
| **Accounts** | Sign up / sign in, per-user strategies, backtest history and portfolio. Passwords are salted PBKDF2 hashes; sessions use expiring bearer tokens. |
| **Dashboard** | Entry point: workflow overview, your strategies, recent backtests. |
| **Strategy Builder** | Write Python (Monaco editor) or assemble rules from visual blocks. Includes live code validation and save/reset/delete. |
| **Parameters** | Slider-based tuning of strategy parameters and a preview of the compiled rules. |
| **Backtest** | Runs your strategy in LEAN (Docker) on real historical data, with a live progress screen. |
| **Results** | Metrics, candlestick chart with BUY/SELL markers, equity curve, drawdown, and a full trade log. |
| **Explore** | Change parameters and preview the estimated impact; run a variation. |
| **Compare** | Overlay equity curves and compare parameters and metrics of two runs. |
| **Documentation** | In-app guide, LEAN overview and a trading glossary (also shown as tooltips). |
| **Profile** | Portfolio holdings, orders and strategies for the signed-in user. |
| **Design** | Dark/light themes, WebGL backgrounds (Three.js), smooth scrolling and scroll reveals. All motion respects the OS "reduce motion" setting. |

## Quick start

### Prerequisites

| Tool | Version | Used for |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | Frontend |
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 | Backend API |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | any recent | Runs the LEAN engine for backtests |

Docker is only needed to **run backtests**. Sign-in, strategy editing and browsing all work without it.

### 1. Get the code and install

```bash
git clone https://github.com/rishavrai563/Algorithmic-Trading-Workbench.git
cd Algorithmic-Trading-Workbench

cd frontend && npm install && cd ..
cd backend  && dotnet restore && cd ..

docker pull quantconnect/lean:latest   # once, before the first backtest
```

### 2. Run

**Windows (one command)** — from the repo root:

```powershell
./run.ps1
```

**macOS / Linux:**

```bash
./run.sh
```

**Or manually, in two terminals:**

```bash
# Terminal 1 — API on http://localhost:5000
cd backend
dotnet run --urls http://localhost:5000

# Terminal 2 — UI on http://localhost:5173
cd frontend
npm run dev
```

Open **http://localhost:5173**.

> **Windows tip:** if your folder path contains `&` (e.g. `HCI&Visualization`), `npm run ...` fails. Run Vite directly instead: `node node_modules/vite/bin/vite.js` (add `build` to build). `run.ps1` already does this.

> **After pulling updates, restart the backend.** The API creates its database and demo account on startup.

### 3. Sign in

A demo account is created on first start:

| Email | Password |
|---|---|
| `rishav@email.com` | `password123` |

Or choose **Sign Up** on the login page to create your own account. New accounts get three starter strategies (RSI Mean Reversion, Moving Average Crossover, Breakout) and a sample portfolio.

## Using the platform

1. **Dashboard** — pick a strategy card, or click **+ New Strategy**.
2. **Strategy Builder** — edit the Python code or switch to **Visual Blocks**. Set the name, asset (search by ticker), timeframe and date range. Click **Save** to store changes, then **Continue to Parameters**.
3. **Parameters** — adjust the sliders (e.g. RSI period, thresholds, stop loss). The *Compiled Rules* panel shows the resulting buy/sell rules. Click **Run Backtest**.
4. **Running** — a progress ring and stage list show the job moving through data loading, LEAN and result parsing.
5. **Results** — review return, drawdown, trades and win rate. Click a BUY/SELL marker on the price chart (or a row in the trade log) for trade details.
6. **Explore** — move sliders to preview how results would shift; click **Run Variation** to run it for real.
7. **Compare** — pick any two runs from this session to compare parameters, metrics and equity curves on one shared scale.
8. **Profile** — view your portfolio, orders and recent strategies. Use **Sign Out** in the sidebar when done.

Keyboard: `Ctrl+Enter` in the code editor continues to Parameters; trade rows and charts are keyboard accessible (arrow keys move the chart cursor). The theme toggle is in the top bar.

## Project structure

```text
AlgoTrade/
├── README.md
├── run.ps1 / run.sh              Start backend + frontend together
├── Documentation/                Architecture, setup, tech stack, user flow, API docs
│
├── backend/                      ASP.NET Core (.NET 8) API
│   ├── Program.cs                App startup, DI, CORS, database creation + demo seed
│   ├── appsettings.json          Connection string, Upstox token, logging
│   ├── Controllers/
│   │   ├── AuthController.cs         Register, login, logout, profile, password
│   │   ├── StrategiesController.cs   Strategy CRUD + backtest history (per user)
│   │   └── BacktestController.cs     Submit/poll backtest jobs, asset search
│   ├── Data/
│   │   └── AtlasDbContext.cs         EF Core SQLite schema (db file: Data/atlas.db)
│   ├── Models/                   User, StrategyProfile, BacktestRecord, backtest DTOs
│   └── Services/
│       ├── UserStore.cs              Accounts, sessions, portfolio seeding
│       ├── StrategyStore.cs          Per-user strategies, history, starter templates
│       ├── PasswordHasher.cs         Salted PBKDF2-SHA256
│       ├── CurrentUser.cs            Resolves the signed-in user from the bearer token
│       ├── BacktestService.cs        Orchestrates a backtest run
│       ├── LeanRunner.cs             Builds the LEAN workspace and runs Docker
│       ├── LeanResultParser.cs       Turns LEAN output into metrics/trades/equity
│       ├── HistoricalDataService.cs  Fetches + validates market data (Yahoo / Upstox)
│       ├── JobManager.cs             Tracks running backtest jobs
│       └── AssetRegistry.cs, DataValidator.cs, ...
│
├── frontend/                     React 19 + Vite
│   ├── index.html
│   ├── public/                   Favicon (atlas-mark.svg)
│   └── src/
│       ├── App.jsx                   Auth/session state, shared app context, routes
│       ├── index.css                 Design tokens (light/dark) and all styles
│       ├── api/                      client.js (auth header), auth.js, strategies.js, backtest.js
│       ├── components/
│       │   ├── Layout.jsx                Sidebar, top bar, page shell
│       │   ├── AtlasLogo.jsx / AtlasMark.jsx   Shard-assembly logo and compact emblem
│       │   ├── LoginScene.jsx / AmbientBackground.jsx   Three.js scenes
│       │   ├── CandlestickChart.jsx      Price chart (lightweight-charts)
│       │   ├── Sparkline.jsx             Equity / drawdown / comparison line chart
│       │   ├── LoadingBacktest.jsx       Backtest progress screen
│       │   └── VisualBlocksEditor.jsx, MetricCard.jsx, DocTooltip.jsx, ThemeToggle.jsx
│       ├── motion/                   WebGL helpers, smooth scroll (Lenis), scroll reveals (GSAP)
│       ├── pages/                    Login, Dashboard, StrategyBuilder, Parameters,
│       │                             BacktestResults, Explore, Compare, Documentation, Profile/
│       ├── data/                     Glossary content and sample/fallback data
│       └── assets/atlas-logo.jpg     Logo artwork
│
└── lean_workspace/               LEAN project, config, custom market data (CSV), results
```

## Architecture

```text
Browser (React)  ──/api (Vite proxy → :5000)──►  ASP.NET Core API  ──►  SQLite (users, sessions,
                                                      │                    strategies, history)
                                                      ▼
                          Yahoo/Upstox data ─► CSV ─► LEAN in Docker ─► parsed results ─► Browser
```

- The frontend proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.js`).
- Every strategy and history request carries `Authorization: Bearer <token>`; the API only returns the signed-in user's data.
- A backtest is submitted as a job, then polled until LEAN finishes.

## Backend API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, returns user + token |
| POST | `/api/auth/login` | – | Sign in |
| POST | `/api/auth/logout` | token | Revoke current token |
| GET / PUT | `/api/auth/me` | token | Read / update profile |
| POST | `/api/auth/me/password` | token | Change password |
| GET / POST | `/api/strategies` | token | List / create strategies |
| GET / PUT / DELETE | `/api/strategies/{id}` | token | Read / save / delete |
| GET | `/api/strategies/history` | token | All backtest records |
| GET / POST | `/api/strategies/{id}/history` | token | Records for a strategy / save a run |
| POST | `/api/backtest` | – | Submit a backtest job |
| GET | `/api/backtest/{jobId}/status` | – | Poll a job |
| GET | `/api/backtest/status`, `/assets`, `/assets/search` | – | Docker health, asset list, ticker search |

More detail in [Documentation/api_doc.md](Documentation/api_doc.md).

## Configuration

`backend/appsettings.json`:

| Key | Default | Meaning |
|---|---|---|
| `ConnectionStrings:Atlas` | `Data Source=Data/atlas.db` | SQLite file, relative to `backend/` |
| `Upstox:AccessToken` | empty | Optional Upstox token for market data. Never commit a real token. |

The database is created automatically on first start. It is git-ignored. To reset all users and data, stop the backend and delete `backend/Data/atlas.db*`.

## Build

```bash
cd frontend && npm run build     # output in frontend/dist
cd backend  && dotnet build
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dashboard says it couldn't load strategies | Backend isn't running, or is an old build. Restart it, sign out, sign in again. |
| Redirected to login unexpectedly | Your 7-day session expired or the database was reset. Sign in again. |
| `npm run dev` fails with a path error on Windows | Folder path contains `&`. Use `node node_modules/vite/bin/vite.js`. |
| Backtest fails immediately | Start Docker Desktop and run `docker pull quantconnect/lean:latest`. |
| `No .NET SDKs were found` | Install the .NET 8 SDK, or add `%LOCALAPPDATA%\dotnet` to PATH (see `dotnet-install.ps1`). |
| Port 5000 or 5173 in use | Stop the other process; the frontend proxy expects the API on 5000. |

## Team Members

| Name | Entry No. | GitHub |
|------|-----------|--------|
| **Ravikant Sharma** | 2024AIB1013 | https://github.com/thyravikant |
| **Rishav Kumar** | 2024AIB1014 | https://github.com/rishavrai563 |

Course: **AI511 – HCI & Visualization**
Institute: **Indian Institute of Technology Ropar**

## Disclaimer

This project is developed for academic, research, and educational purposes. Backtest results are historical simulations and should not be treated as investment advice or as a guarantee of future performance.
