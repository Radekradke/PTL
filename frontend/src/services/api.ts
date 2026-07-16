export const API_URL = import.meta.env.VITE_API_URL || "https://ptl-bjvd.onrender.com"

export const TECHNICAL_USER_KEY = "lifting-user"
export const PORTAL_USER_KEY = "lifting-portal-employee"
export const AUTH_CHANGED_EVENT = "lifting-auth-changed"

export function getTechnicalUser() {
  const stored = localStorage.getItem(TECHNICAL_USER_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function getTechnicalToken() {
  const stored = localStorage.getItem(TECHNICAL_USER_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)?.token || null
  } catch {
    return null
  }
}

export function getPortalToken() {
  const stored = localStorage.getItem(PORTAL_USER_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)?.token || null
  } catch {
    return null
  }
}

export function apiFetch(path: string, init: RequestInit = {}, token = getTechnicalToken()) {
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })
}
