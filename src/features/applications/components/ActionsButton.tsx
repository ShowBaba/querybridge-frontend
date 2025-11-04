import { useEffect, useRef, useState } from 'react'

type ActionItem = {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger'
  icon?: React.ReactNode
}

type Props = {
  items: ActionItem[]
  buttonLabel?: string
  className?: string
}

export function ActionsButton({ items, buttonLabel = 'Actions', className }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
      >
        {buttonLabel}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Actions"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
          onClick={(ev) => ev.stopPropagation()}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${item.tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
                }`}
            >
              {item.icon ?? null}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}