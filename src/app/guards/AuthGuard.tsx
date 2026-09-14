import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useSyncExternalStore } from 'react'
import { AUTH_CHANGE_EVENT, isAuthenticated, registerAuthStorageListener, scheduleAutoLogout } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

function subscribe(callback: () => void) {
  const onStorage = () => callback()
  const onAuthChange = () => callback()
  window.addEventListener('storage', onStorage)
  window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange)
  }
}
function getSnapshot() { return isAuthenticated() }
function getServerSnapshot() { return false }

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const ok = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    scheduleAutoLogout()
    return registerAuthStorageListener(() => navigate('/signin', { replace: true }))
  }, [navigate])

  if (!ok) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
