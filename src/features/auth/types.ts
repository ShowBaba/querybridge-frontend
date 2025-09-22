// Auth-specific types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}
