function b64urlToStr(input: string) {
  const pad = input.length % 4 ? 4 - (input.length % 4) : 0
  const b64 = (input + '='.repeat(pad)).replace(/-/g, '+').replace(/_/g, '/')
  return atob(b64)
}

export function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = decodeURIComponent(
      b64urlToStr(payload)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function tokenExpiryMs(token: string): number | null {
  const payload = parseJwt<{ exp?: number }>(token)
  return payload?.exp ? payload.exp * 1000 : null
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const expMs = tokenExpiryMs(token)
  if (!expMs) return false // if no exp, treat as non-expiring
  return Date.now() >= expMs - skewSeconds * 1000
}