import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useSyncExternalStore, useRef } from 'react'
import { isAuthenticated, registerAuthStorageListener, scheduleAutoLogout } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

function subscribe(callback: () => void) {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
function getSnapshot() { return isAuthenticated() }
function getServerSnapshot() { return true }

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const ok = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const mounted = useRef(false)

  useEffect(() => {
    scheduleAutoLogout()
    registerAuthStorageListener(() => navigate('/signin', { replace: true }))
    mounted.current = true
  }, [navigate])

  if (!ok) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}