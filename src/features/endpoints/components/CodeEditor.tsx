import { useEffect, useMemo, useRef, useState } from 'react'

type CodeEditorProps = {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  minRows?: number
  className?: string
  id?: string
  'aria-label'?: string
}

export function CodeEditor({
  value,
  onChange,
  placeholder,
  readOnly,
  minRows = 8,
  className = '',
  id,
  'aria-label': ariaLabel,
}: CodeEditorProps) {
  const [rows, setRows] = useState(minRows)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gutterRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)

  // Compute line numbers
  const lines = useMemo(() => {
    const count = (value?.match(/\n/g)?.length ?? 0) + 1
    return Array.from({ length: Math.max(count, minRows) }, (_, i) => i + 1)
  }, [value, minRows])

  // Adjust rows visually (prevents jumpy height)
  useEffect(() => {
    const count = (value?.match(/\n/g)?.length ?? 0) + 1
    setRows(Math.max(count, minRows))
  }, [value, minRows])

  // Sync scroll: textarea -> gutter
  const handleScroll = () => {
    if (!textRef.current || !gutterRef.current) return
    gutterRef.current.scrollTop = textRef.current.scrollTop
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative grid",
        "grid-cols-[auto,1fr]",
        "border border-black/10 rounded-lg overflow-hidden",
        "bg-[#0f172a]", // slate-900
        className,
      ].join(' ')}
    >
      {/* Gutter */}
      <div
        ref={gutterRef}
        aria-hidden
        className="select-none bg-[#0b1220] text-[#64748b] text-xs leading-[1.6] px-3 py-2 overflow-auto"
        style={{ maxHeight: rows * 20 + 24 }} // approximate height to match textarea
      >
        <pre className="m-0 p-0 font-mono">
          {lines.map(n => String(n).padStart(3, ' ')).join('\n')}
        </pre>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id={id}
          ref={textRef}
          aria-label={ariaLabel}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className={[
            "block w-full",
            "bg-transparent text-[#e2e8f0] placeholder:text-[#334155]",
            "font-mono text-sm leading-[1.6]",
            "outline-none resize-none",
            "px-3 py-2",
          ].join(' ')}
          rows={rows}
          style={{
            tabSize: 2,
            whiteSpace: 'pre',
            overflow: 'auto',
          }}
        />
      </div>
    </div>
  )
}