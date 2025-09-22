import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { authApi, SignInRequest, SignUpRequest, type SignUpResponseBody, type SignInResponseBody } from './api'

// Auth hooks
export function useSignIn() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (data: SignInRequest) => authApi.signIn(data),
    onSuccess: (response) => {
      // Check HTTP status and server body status
      const httpStatus = response.status
      const body = response.data as SignInResponseBody
      if (httpStatus === 200 && body?.status === 200 && body?.data) {
        const token = body.data.token || body.data.access_token
        if (token) {
          login(token, body.data.user)
          navigate('/applications')
        }
      }
    },
  })
}

export function useSignUp() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: SignUpRequest) => authApi.signUp(data),
    retry: false,                // ✅ never retry POST
    onSuccess: (response) => {
      const httpStatus = response.status
      const body = response.data as SignUpResponseBody
      if (httpStatus === 200 && body?.status === 200) {
        navigate('/signin', { replace: true })
      }
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
  })
}

// Placeholder hook to get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // Placeholder implementation
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('No token')

      // This would make an API call to get user info
      return {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      }
    },
    enabled: !!localStorage.getItem('auth_token'),
  })
}
