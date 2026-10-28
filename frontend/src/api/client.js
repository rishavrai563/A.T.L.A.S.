/**
 * Shared fetch wrapper: attaches the signed-in user's bearer token and
 * announces expired sessions so the app can return to the login page.
 */

export const API_BASE = '/api'
export const SESSION_KEY = 'atlas-user'
export const UNAUTHORIZED_EVENT = 'atlas:unauthorized'

export function getSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY))
    return saved?.token ? saved : null
  } catch {
    return null
  }
}

export async function apiFetch(path, options = {}) {
  const token = getSession()?.token
  const headers = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  return res
}

// Reads the JSON body and throws the server's `error` message on failure.
export async function readJson(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || fallbackMessage)
  return data
}
