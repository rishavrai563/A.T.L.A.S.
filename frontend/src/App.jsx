import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StrategyBuilder from './pages/StrategyBuilder'
import Parameters from './pages/Parameters'
import BacktestResults from './pages/BacktestResults'
import Explore from './pages/Explore'
import Compare from './pages/Compare'
import Profile from './pages/Profile/Profile'
import Documentation from './pages/Documentation'
import Login from './pages/Login'
import LoadingBacktest from './components/LoadingBacktest'
import { defaultStrategy, defaultStrategyCode } from './data/sampleData'
import { fetchStrategies, fetchAllHistory } from './api/strategies'
import { fetchMe, logoutUser } from './api/auth'
import { getSession, SESSION_KEY, UNAUTHORIZED_EVENT } from './api/client'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// Sessions saved by the pre-ATLAS build have no token and must sign in again.
localStorage.removeItem('algotrade-user')

export default function App() {
  // Auth state: the stored session holds the user profile plus its bearer token
  const [user, setUser] = useState(getSession)

  const handleLogin = useCallback((userData) => {
    setUser(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const handleLogout = useCallback(() => {
    logoutUser().catch(() => {}) // revoke the token server-side; sign out locally regardless
    clearSession()
  }, [clearSession])

  // Expired or revoked tokens send the user back to the login page.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession)
  }, [clearSession])

  // Refresh the stored profile (name, portfolio) from the server once per session.
  const token = user?.token
  useEffect(() => {
    if (!token) return
    fetchMe()
      .then((fresh) => handleLogin(fresh))
      .catch((err) => console.warn('[App] Could not refresh profile:', err.message))
  }, [token, handleLogin])

  // Active strategy being worked on
  const [strategy, setStrategy] = useState(defaultStrategy)
  const [strategyCode, setStrategyCode] = useState(defaultStrategyCode)
  const [activeStrategyId, setActiveStrategyId] = useState(null)

  // Backtest state
  const [backtestResults, setBacktestResults] = useState(null)
  const [backtestError, setBacktestError] = useState(null)
  const [runHistory, setRunHistory] = useState([])

  // Backend-sourced data
  const [strategies, setStrategies] = useState([])
  const [backtestHistory, setBacktestHistory] = useState([])

  // Load strategies and history from the backend on mount
  // 'loading' | 'ready' | 'error' so pages can tell empty from failed
  const [dataStatus, setDataStatus] = useState('loading')
  const refreshData = useCallback(async () => {
    try {
      const [strats, history] = await Promise.all([
        fetchStrategies(),
        fetchAllHistory(),
      ])
      setStrategies(strats)
      setBacktestHistory(history)
      setDataStatus('ready')
    } catch (err) {
      console.warn('[App] Backend not available:', err.message)
      setDataStatus('error')
    }
  }, [])

  // Strategies and history belong to the signed-in user: load after login,
  // clear on logout so the next user never sees them.
  useEffect(() => {
    if (token) {
      setDataStatus('loading')
      refreshData()
    } else {
      setStrategies([])
      setBacktestHistory([])
      setBacktestResults(null)
      setRunHistory([])
      setActiveStrategyId(null)
    }
  }, [token, refreshData])

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <AppContext.Provider value={{
      user, handleLogin, handleLogout,
      strategy, setStrategy,
      strategyCode, setStrategyCode,
      activeStrategyId, setActiveStrategyId,
      backtestResults, setBacktestResults,
      backtestError, setBacktestError,
      runHistory, setRunHistory,
      strategies, setStrategies,
      backtestHistory, setBacktestHistory,
      refreshData, dataStatus, setDataStatus,
    }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/strategy" element={<StrategyBuilder />} />
          <Route path="/strategy-builder" element={<StrategyBuilder />} />
          <Route path="/parameters" element={<Parameters />} />
          <Route path="/backtest-running" element={<LoadingBacktest />} />
          <Route path="/results" element={<BacktestResults />} />
          <Route path="/results/:id" element={<BacktestResults />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/documentation" element={<Documentation />} />
        </Routes>
      </Layout>
    </AppContext.Provider>
  )
}
