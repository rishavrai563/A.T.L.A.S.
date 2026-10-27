/**
 * API client for the signed-in user's strategies and backtest history.
 */

import { apiFetch } from './client'

// ── Strategies ─────────────────────────────────────────

export async function fetchStrategies() {
  const res = await apiFetch('/strategies')
  if (!res.ok) throw new Error('Failed to load strategies')
  return res.json()
}

export async function fetchStrategy(id) {
  const res = await apiFetch(`/strategies/${id}`)
  if (!res.ok) throw new Error('Strategy not found')
  return res.json()
}

export async function createStrategy(profile) {
  const res = await apiFetch('/strategies', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Failed to create strategy')
  return res.json()
}

export async function saveStrategy(id, profile) {
  const res = await apiFetch(`/strategies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Failed to save strategy')
  return res.json()
}

export async function deleteStrategy(id) {
  const res = await apiFetch(`/strategies/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete strategy')
  return res.json()
}

// ── Backtest History ───────────────────────────────────

export async function fetchAllHistory() {
  const res = await apiFetch('/strategies/history')
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export async function fetchStrategyHistory(strategyId) {
  const res = await apiFetch(`/strategies/${strategyId}/history`)
  if (!res.ok) throw new Error('Failed to load strategy history')
  return res.json()
}

export async function recordBacktest(strategyId, record) {
  const res = await apiFetch(`/strategies/${strategyId}/history`, {
    method: 'POST',
    body: JSON.stringify(record),
  })
  if (!res.ok) throw new Error('Failed to record backtest')
  return res.json()
}
