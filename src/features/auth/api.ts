import { apiClient } from '@/lib/axios'
import type { AxiosResponse } from 'axios'

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  firstname: string
  lastname: string
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  firstname: string
  lastname: string
}

export interface AuthResponse {
  user: User
  token?: string
  access_token?: string
}

export interface SignInResponseBody {
  status: number
  message: string
  data: {
    user: User
    token?: string
    access_token?: string
  } | null
}

export interface SignUpResponseBody {
  status: number
  message: string
  data: User | null
}

// API functions
export const authApi = {
  signIn: async (data: SignInRequest): Promise<AxiosResponse<SignInResponseBody>> => {
    const response = await apiClient.post<SignInResponseBody>('/auth/login', data)
    return response
  },

  signUp: async (data: SignUpRequest): Promise<AxiosResponse<SignUpResponseBody>> => {
    const response = await apiClient.post<SignUpResponseBody>('/user/register', data)
    return response
  },

  forgotPassword: async (email: string): Promise<void> => {
    // Placeholder implementation
    await apiClient.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    // Placeholder implementation
    await apiClient.post('/auth/reset-password', { token, password })
  },

  verifyEmail: async (token: string): Promise<void> => {
    // Placeholder implementation
    await apiClient.post('/auth/verify-email', { token })
  },

  resendVerification: async (email: string): Promise<void> => {
    // Placeholder implementation
    await apiClient.post('/auth/resend-verification', { email })
  },
}
