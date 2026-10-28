# ATLAS Frontend

React 19 + Vite frontend for ATLAS (Algorithmic Trading Lab and Analysis System). It talks to the ASP.NET Core backend through the `/api` proxy (`vite.config.js` → `http://localhost:5000`), so start the backend first. See the [root README](../README.md) for the full guide.

Flow: Login → Dashboard → Strategy Builder → Parameters → Running Backtest → Results → Explore → Compare

## Run

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

On Windows, if your folder path contains `&`, run Vite directly: `node node_modules/vite/bin/vite.js` (add `build` to build).

Demo login: `rishav@email.com` / `password123`.

## Folder guide

```text
public/            Favicon
src/
  api/             client.js (adds the bearer token), auth.js, strategies.js, backtest.js
  assets/          ATLAS logo artwork
  components/      Layout, charts, logo, Three.js scenes, backtest loader, editors
  motion/          WebGL helpers, smooth scroll, scroll reveals, reduced-motion checks
  pages/           Login, Dashboard, StrategyBuilder, Parameters, BacktestResults,
                   Explore, Compare, Documentation, Profile/
  data/            Glossary content and fallback/sample data
  App.jsx          Session state, shared app context, routes
  main.jsx         React entry point
  index.css        Design tokens (light/dark) and all styling
```

## Notes

- The session token lives in `localStorage` under `atlas-user`. A `401` from any API call signs the user out.
- Strategies, history and results come from the backend; sample data in `src/data/` is only a fallback.
- All animation respects the OS "reduce motion" setting.
