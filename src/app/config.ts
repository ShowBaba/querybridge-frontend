export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  appName: import.meta.env.VITE_APP_NAME || 'QueryBridge',
  gqlBaseURL: import.meta.env.VITE_API_BASE_URL + '/gql',
} as const
