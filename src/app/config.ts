export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  appName: import.meta.env.VITE_APP_NAME || 'QueryBridge',
} as const
