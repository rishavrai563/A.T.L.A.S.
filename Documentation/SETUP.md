# Setup Guide

For the full overview (features, usage, project structure) see the [README](../README.md). This page covers setup only.

## 1. Prerequisites

- Node.js 20.19+ or 22.12+
- .NET 8 SDK
- Docker Desktop (only needed to run backtests)
- Git

## 2. Clone the repository

```bash
git clone https://github.com/rishavrai563/Algorithmic-Trading-Workbench.git
cd Algorithmic-Trading-Workbench
```

## 3. Install dependencies

```bash
cd frontend && npm install && cd ..
cd backend && dotnet restore && cd ..
docker pull quantconnect/lean:latest
```

## 4. Run

Everything at once:

```powershell
./run.ps1      # Windows
./run.sh       # macOS / Linux
```

Or separately:

```bash
cd backend  && dotnet run --urls http://localhost:5000   # API
cd frontend && npm run dev                               # UI on http://localhost:5173
```

> On Windows, if the folder path contains `&`, `npm run` fails. Use `node node_modules/vite/bin/vite.js` instead (`run.ps1` already does).

## 5. Sign in

On first start the backend creates its database (`backend/Data/atlas.db`) and a demo account:

- Email: `rishav@email.com`
- Password: `password123`

You can also sign up from the login page. To wipe all users and data, stop the backend and delete `backend/Data/atlas.db*`. **Restart the backend after pulling updates.**

## 6. LEAN workspace

`lean_workspace/` holds the LEAN project, `config.json`, custom market data CSVs and results. The backend writes strategy code and parameters there for each run and mounts it into the Docker container.

## 7. Configuration and secrets

Settings are in `backend/appsettings.json` (`ConnectionStrings:Atlas`, `Upstox:AccessToken`). Never commit real tokens; use user secrets or environment variables, e.g. `Upstox__AccessToken`. The SQLite database file is git-ignored.

## 8. Common Git workflow

```bash
git pull origin main
git status
git add .
git commit -m "Describe your change"
git push origin main
```
