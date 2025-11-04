import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'info'

export type ToastOptions = {
  id?: string
  message: string
  type?: ToastType
  duration?: number // ms (default 2000)
}

type ToastRecord = Required<ToastOptions>

type ToastContextValue = {
  toast: (options: ToastOptions | string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef<Record<string, number>>({})

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timers.current[id]
    }
  }, [])

  const enqueue = useCallback((opts: ToastOptions | string) => {
    const normalized: ToastRecord = {
      id: crypto.randomUUID(),
      message: typeof opts === 'string' ? opts : opts.message,
      type: typeof opts === 'string' ? 'info' : (opts.type ?? 'info'),
      duration: typeof opts === 'string' ? 2000 : (opts.duration ?? 2000),
    }
    setToasts(prev => [...prev, normalized])

    const timeout = window.setTimeout(() => remove(normalized.id), normalized.duration)
    timers.current[normalized.id] = timeout
  }, [remove])

  const api = useMemo<ToastContextValue>(() => ({
    toast: enqueue,
    success: (message, duration) => enqueue({ message, type: 'success', duration }),
    error: (message, duration) => enqueue({ message, type: 'error', duration }),
    info: (message, duration) => enqueue({ message, type: 'info', duration }),
  }), [enqueue])

  // Clean up timers on unmount
  useEffect(() => () => {
    Object.values(timers.current).forEach(t => window.clearTimeout(t))
    timers.current = {}
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
          {toasts.map(t => (
            <div
              key={t.id}
              role="alert"
              className={[
                'px-4 py-3 rounded-lg shadow-lg text-sm font-medium border transition-transform duration-200',
                t.type === 'success' && 'bg-green-50 text-green-700 border-green-200',
                t.type === 'error' && 'bg-red-50 text-red-700 border-red-200',
                t.type === 'info' && 'bg-gray-50 text-gray-700 border-gray-200',
              ].filter(Boolean).join(' ')}
              onClick={() => remove(t.id)}
              title="Click to dismiss"
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}