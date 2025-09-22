import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { router } from '@/app/router'

const createTestRouter = (initialEntries = ['/signin']) => {
  return createMemoryRouter(router.routes, {
    initialEntries,
  })
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('Router', () => {
  it('renders sign in page at /signin', () => {
    const testRouter = createTestRouter(['/signin'])

    render(
      <TestWrapper>
        <RouterProvider router={testRouter} />
      </TestWrapper>
    )

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('renders sign up page at /signup', () => {
    const testRouter = createTestRouter(['/signup'])

    render(
      <TestWrapper>
        <RouterProvider router={testRouter} />
      </TestWrapper>
    )

    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('renders forgot password page at /forgot-password', () => {
    const testRouter = createTestRouter(['/forgot-password'])

    render(
      <TestWrapper>
        <RouterProvider router={testRouter} />
      </TestWrapper>
    )

    expect(screen.getByText('Reset your password')).toBeInTheDocument()
  })

  it('renders reset password page at /reset-password', () => {
    const testRouter = createTestRouter(['/reset-password'])

    render(
      <TestWrapper>
        <RouterProvider router={testRouter} />
      </TestWrapper>
    )

    expect(screen.getByText('Set new password')).toBeInTheDocument()
  })

  it('renders verify email page at /verify-email', () => {
    const testRouter = createTestRouter(['/verify-email'])

    render(
      <TestWrapper>
        <RouterProvider router={testRouter} />
      </TestWrapper>
    )

    expect(screen.getByText('Verify your email')).toBeInTheDocument()
  })
})
