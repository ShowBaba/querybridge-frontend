import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstname: string
  lastname: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        localStorage.setItem('qb_token', token)
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('qb_token')
        set({ token: null, user: null, isAuthenticated: false })
      },
      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Sync localStorage token with store on hydration
        if (state) {
          const token = localStorage.getItem('qb_token')
          if (token && !state.token) {
            state.token = token
            state.isAuthenticated = true
          } else if (!token && state.token) {
            state.token = null
            state.isAuthenticated = false
            state.user = null
          }
        }
      },
    }
  )
)
