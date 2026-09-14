import { isTokenExpired, tokenExpiryMs } from './jwt'

const TOKEN_KEY = 'qb_token'
export const AUTH_CHANGE_EVENT = 'qb-auth-change'
let logoutTimer: number | null = null

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  scheduleAutoLogout()
  notifyAuthChange()
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  if (logoutTimer) {
    window.clearTimeout(logoutTimer)
    logoutTimer = null
  }
  notifyAuthChange()
}

export function isAuthenticated(): boolean {
  const t = getToken()
  return !!t && !isTokenExpired(t)
}

export function scheduleAutoLogout() {
  if (logoutTimer) {
    window.clearTimeout(logoutTimer)
    logoutTimer = null
  }
  const t = getToken()
  if (!t) return
  const exp = tokenExpiryMs(t)
  if (!exp) return
  const delay = Math.max(0, exp - Date.now())
  logoutTimer = window.setTimeout(() => {
    clearToken()
    localStorage.setItem('__qb_auth_ping__', String(Date.now()))
  }, delay)
}

/** Call once at app boot to sync across tabs. Returns cleanup. */
export function registerAuthStorageListener(onLogout: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === TOKEN_KEY || e.key === '__qb_auth_ping__') {
      if (!getToken() || !isAuthenticated()) onLogout()
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
