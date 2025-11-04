const methodStyles: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 border border-green-200',
  POST: 'bg-blue-100 text-blue-800 border border-blue-200',
  PUT: 'bg-amber-100 text-amber-900 border border-amber-200',
  PATCH: 'bg-purple-100 text-purple-800 border border-purple-200',
  DELETE: 'bg-red-100 text-red-800 border border-red-200',
  OPTIONS: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  HEAD: 'bg-slate-200 text-slate-800 border border-slate-300',
  TRACE: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  CONNECT: 'bg-orange-100 text-orange-800 border border-orange-200',
  DEFAULT: 'bg-gray-100 text-gray-800 border border-gray-200',
}

export function MethodBadge({ method }: { method: string }) {
  const key = (method || '').toUpperCase()
  const cls = methodStyles[key] ?? methodStyles.DEFAULT
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${cls}`}>
      {key || '—'}
    </span>
  )
}