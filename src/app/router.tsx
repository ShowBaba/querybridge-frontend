import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard'
import { AppShell } from '@/components/AppShell/AppShell'

// Auth pages
import { SignIn } from '@/features/auth/pages/SignIn'
import { SignUp } from '@/features/auth/pages/SignUp'
import { ForgotPassword } from '@/features/auth/pages/ForgotPassword'
import { ResetPassword } from '@/features/auth/pages/ResetPassword'
import { VerifyEmail } from '@/features/auth/pages/VerifyEmail'

// Application pages
import { ApplicationsList } from '@/features/applications/pages/ApplicationsList'
import { ApplicationDetail } from '@/features/application-detail/pages/ApplicationDetail'
import { CustomLogicTab } from '@/features/sandbox/pages/CustomLogicTab'
import { DatabasesPage } from '@/features/databases/pages/DatabasesPage'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  // Protected routes
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/applications" replace />,
      },
      {
        path: 'applications',
        element: <ApplicationsList />,
      },
      {
        path: 'applications/:appId',
        element: <ApplicationDetail />,
        children: [
          {
            path: 'custom-logic',
            element: <CustomLogicTab />,
          },
        ],
      },
      {
        path: 'apps/:appId/databases',
        element: <DatabasesPage />,
      },
    ],
  },
  // Fallback route
  {
    path: '*',
    element: <Navigate to="/signin" replace />,
  },
])
