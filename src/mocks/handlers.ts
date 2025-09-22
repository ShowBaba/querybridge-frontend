import { http, HttpResponse } from 'msw'

// Placeholder handlers - no real API logic implemented yet
export const handlers = [
  // Auth endpoints
  http.post('/auth/signin', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      token: 'mock-jwt-token',
    })
  }),

  http.post('/auth/signup', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      token: 'mock-jwt-token',
    })
  }),

  http.post('/auth/forgot-password', () => {
    return HttpResponse.json({ message: 'Reset link sent' })
  }),

  http.post('/auth/reset-password', () => {
    return HttpResponse.json({ message: 'Password reset successfully' })
  }),

  http.post('/auth/verify-email', () => {
    return HttpResponse.json({ message: 'Email verified successfully' })
  }),

  http.post('/auth/resend-verification', () => {
    return HttpResponse.json({ message: 'Verification email sent' })
  }),

  // Applications endpoints
  http.get('/applications', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'E-commerce API',
          description: 'REST API for e-commerce platform',
          status: 'active',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z',
        },
        {
          id: '2',
          name: 'User Management',
          description: 'User authentication and profile management',
          status: 'active',
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-18T16:20:00Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    })
  }),

  http.get('/applications/:id', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        name: 'E-commerce API',
        description: 'REST API for e-commerce platform',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
      },
    })
  }),

  // User endpoints
  http.get('/user/me', () => {
    return HttpResponse.json({
      data: {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    })
  }),
]
