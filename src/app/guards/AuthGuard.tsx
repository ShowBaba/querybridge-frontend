import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = localStorage.getItem('qb_token')

  if (!token) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
