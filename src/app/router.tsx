import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard'
import { AppShell } from '@/components/AppShell/AppShell'
import { LandingPage } from '@/pages/LandingPage'

// Auth pages
import { SignIn } from '@/features/auth/pages/SignIn'
import { SignUp } from '@/features/auth/pages/SignUp'
import { ForgotPassword } from '@/features/auth/pages/ForgotPassword'
import { ResetPassword } from '@/features/auth/pages/ResetPassword'
import { VerifyEmail } from '@/features/auth/pages/VerifyEmail'

// Application pages
import { ApplicationsList } from '@/features/applications/pages/ApplicationsList'
import { ApplicationDetail } from '@/features/applications/pages/ApplicationDetail'
import { CustomLogicTab } from '@/features/sandbox/pages/CustomLogicTab'
import { DatabasesPage } from '@/features/databases/pages/DatabasesPage'
import { EndpointsPage } from '@/features/endpoints/pages/EndpointsPage'
import DatabaseDetailsPage from '@/features/databases/pages/DatabaseDetailsPage'
import EndpointDetailsPage from '@/features/endpoints/pages/EndpointDetailsPage'
import DatabaseList from '@/features/databases/pages/DatabaseList'
import DashboardPage from '@/features/dashboard/DashboardPage'
import { EndpointList } from '@/features/endpoints/pages/EndpointList'

export const router = createBrowserRouter([
  {
    path: '/landing',
    element: <LandingPage />,
  },
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
  {
    path: '/',
    element: <Navigate to="/landing" replace />,
  },
  // Protected routes
  {
    path: '/app',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'applications',
        element: <ApplicationsList />,
      },
      {
        path: 'databases',
        element: <DatabaseList />,
      },
      {
        path: 'endpoints',
        element: <EndpointList />,
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
        path: 'applications/:appId/databases',
        element: <DatabasesPage />,
      },
      { path: 'applications/:appId/endpoints', element: <EndpointsPage /> },
      {
        path: 'applications/:appId/databases/:dbId',
        element: <DatabaseDetailsPage />,
      },
      {
        path: 'applications/:appId/endpoints/:endpointId',
        element: <EndpointDetailsPage />,
      },
    ],
  },
  // Fallback route
  {
    path: '*',
    element: <Navigate to="/signin" replace />,
  },
])
