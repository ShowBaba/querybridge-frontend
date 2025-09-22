import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success'
  children: ReactNode
  className?: string
}

export function Alert({ variant = 'default', children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        {
          'border-gray-200 bg-white text-gray-900': variant === 'default',
          'border-red-200 bg-red-50 text-red-900': variant === 'destructive',
          'border-green-200 bg-green-50 text-green-900': variant === 'success',
        },
        className
      )}
    >
      {children}
    </div>
  )
}
