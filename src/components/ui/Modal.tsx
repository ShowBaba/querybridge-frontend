import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg',
          className
        )}
      >
        {title && (
          <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
