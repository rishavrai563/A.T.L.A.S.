# System Architecture

## High-level flow

```text
Sign in (bearer-token session)
        ↓
Strategy Builder  ←→  Backend (per-user strategies in SQLite)
        ↓
Parameter Configuration
        ↓
Backend (job manager)
        ↓
Historical data (Yahoo / Upstox) → CSV → LEAN in Docker
        ↓
Results and Trade Data
        ↓
Visualization Layer
        ↓
Parameter Exploration → Strategy Comparison
```

## Frontend

A React 19 application built with Vite. It is responsible for:

- authentication state (the session token is kept in `localStorage` and sent on every API call; an expired token returns the user to the login page),
- page navigation and the app shell (sidebar, top bar, light/dark theme),
- strategy configuration UI (Monaco code editor and visual blocks),
- backtest controls and the progress screen,
- result visualization (candlestick chart, equity/drawdown line charts),
- parameter exploration and strategy comparison,
- the motion layer: Three.js scenes (login terrain, ambient background), Lenis smooth scrolling, GSAP reveals and the ATLAS logo shard animation. All of it honours `prefers-reduced-motion`.

## Backend

An ASP.NET Core (.NET 8) API. Responsibilities:

- **Accounts and sessions:** registration, login, logout, profile and password change. Passwords use salted PBKDF2-SHA256; session tokens are random, expire after 7 days, and only their SHA-256 hash is stored.
- **Per-user data:** strategies and backtest history are stored in SQLite (Entity Framework Core). Every query is filtered by the signed-in user, and new accounts receive starter strategies and a sample portfolio.
- **Backtesting:** receives a request, fetches and validates historical data, builds a LEAN workspace, runs the Docker container and parses the output into metrics, trades and an equity curve. Jobs run asynchronously and are polled by the frontend.

## LEAN workspace

LEAN is the backtesting engine. Historical data (custom CSV files) and the strategy's parameters are mounted into the container to produce simulated trading results.

## Design principle

The system keeps the configuration visible from the start of the workflow to the final result so that the user can verify what was actually tested.
