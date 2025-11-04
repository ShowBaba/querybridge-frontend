import { useState } from 'react'

type DocTooltipProps = {
  title: string
  content: string
  align?: 'left' | 'right'
  widthClass?: string
}

export function DocTooltip({
  title,
  content,
  align = 'left',
  widthClass = 'w-[28rem]',
}: DocTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#ec1313] hover:text-[#b00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec1313]"
        aria-label={`Show ${title} docs`}
        title={`Show ${title} docs`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
            fontFamily="sans-serif"
          >
            i
          </text>
        </svg>
      </button>

      {open && (
        <div
          className={[
            'absolute top-full mt-2 z-50 rounded-lg border border-gray-200 bg-white shadow-lg text-sm p-3',
            'max-h-[60vh] overflow-y-auto',
            widthClass,
            align === 'left' ? 'left-0' : 'right-0',
          ].join(' ')}
        >
          <h4 className="font-semibold mb-1 text-[#111827]">{title}</h4>
          <pre className="whitespace-pre-wrap text-[#374151] leading-snug text-xs font-mono">
            {content}
          </pre>
        </div>
      )}
    </div>
  )
}