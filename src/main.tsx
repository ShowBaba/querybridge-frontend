import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { queryClient } from './app/queryClient'
import { ToastProvider } from './components/ui/Toast'
import './index.css'
import { scheduleAutoLogout } from './lib/auth'

scheduleAutoLogout()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>,
)
