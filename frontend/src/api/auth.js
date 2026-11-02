/**
 * API client for user accounts and sessions.
 * Login and registration return the user's profile plus a bearer `token`.
 */

import { apiFetch, readJson } from './client'

export async function registerUser(name, email, password) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  return readJson(res, 'Registration failed')
}

export async function loginUser(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return readJson(res, 'Login failed')
}

/** Revokes the current session token on the server. */
export async function logoutUser() {
  await apiFetch('/auth/logout', { method: 'POST' })
}

/** Current user with up-to-date portfolio; throws if the session expired. */
export async function fetchMe() {
  return readJson(await apiFetch('/auth/me'), 'Session expired')
}

export async function updateProfile(name) {
  const res = await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) })
  return readJson(res, 'Failed to update profile')
}

export async function changePassword(currentPassword, newPassword) {
  const res = await apiFetch('/auth/me/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  return readJson(res, 'Failed to change password')
}
