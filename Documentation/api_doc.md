# API Documentation

## Overview
REST API of the ATLAS ASP.NET Core backend (default `http://localhost:5000`). It has three controllers: `AuthController` (accounts and sessions), `StrategiesController` (per-user strategies and backtest history) and `BacktestController` (LEAN execution). All bodies and responses are JSON.

## Authentication
Login and registration return a `token`. Send it on every protected request:

```
Authorization: Bearer <token>
```

- Tokens expire after 7 days and are revoked on logout. Only a hash of the token is stored server-side.
- A missing, expired or revoked token returns `401 { "error": "Session expired. Please sign in again." }`.
- Strategies and history are scoped to the signed-in user. Another user's strategy ID returns `404`.

---

## 1. Auth Controller
**Base Route:** `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | – | Body `{ name, email, password }`. Password ≥ 6 chars, valid email. Returns the user plus `token`. `409` if the email exists. |
| POST | `/login` | – | Body `{ email, password }` (email is case-insensitive). Returns the user plus `token`; `401` on bad credentials. |
| POST | `/logout` | token | Revokes the current token. |
| GET | `/me` | token | Current user with portfolio. |
| PUT | `/me` | token | Body `{ name }`. Updates the display name. |
| POST | `/me/password` | token | Body `{ currentPassword, newPassword }`. Signs out all other sessions. |

User response shape: `{ token, id, name, email, clientId, memberSince, cash, holdings[], orders[] }`. Password hashes are never returned.

---

## 2. Strategies Controller
**Base Route:** `/api/strategies` — all routes require a token.

### `GET` `/api/strategies`
Lists the user's strategies.

### `GET` `/api/strategies/{id}`
Returns one strategy (`404` if it isn't the user's).

### `POST` `/api/strategies`
Creates a strategy. Body: StrategyProfile. The owner is set from the session.

### `PUT` `/api/strategies/{id}`
Saves changes. If `parametersSchema` is omitted or empty, the existing schema is kept.

### `DELETE` `/api/strategies/{id}`
Deletes a strategy.

### Backtest History

- `GET /api/strategies/history` — all of the user's backtest records, newest first.
- `GET /api/strategies/{id}/history` — records for one strategy.
- `POST /api/strategies/{id}/history` — saves a completed run (body: BacktestRecord) and marks the strategy *Backtested*. `404` if the strategy isn't the user's.

---

## 3. Backtest Controller
**Base Route:** `/api/backtest` — currently not protected by login.

- `POST /api/backtest` — submits strategy code and configuration to LEAN; spawns an asynchronous job. Body: BacktestRequest.
- `GET /api/backtest/{id}/status` — polls a job; returns progress and, when finished, the result.
- `GET /api/backtest/status` — health check: Docker availability and LEAN image status.
- `GET /api/backtest/assets` — static list of supported assets.
- `GET /api/backtest/assets/search?q=` — Yahoo Finance ticker autocomplete proxy.

---

## Storage
Data lives in a SQLite database (`backend/Data/atlas.db`, created on first start): users, sessions, holdings, orders, strategies and backtest records. Parameter schemas, parameter values and full backtest results are stored as JSON columns.
