import { getToken, clearToken, isAuthenticated } from './auth'

export async function getAuthToken(): Promise<string> {
  const token = getToken()
  if (!token || !isAuthenticated()) {
    clearToken()
    window.location.replace('/signin')
    throw new Error('Unauthenticated')
  }
  return token
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (token && isAuthenticated()) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers })

  if (res.status === 401) {
    clearToken()
    window.location.replace('/signin')
    throw new Error('Unauthenticated')
  }
  return res
}