import React, { useEffect, useMemo, useState } from 'react'
import { fetchApplicationLogs, type AppLog } from '../api'
import { format } from 'date-fns'

type Level = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | string

const levelStyles: Record<Level, string> = {
  ERROR: 'bg-red-100 text-red-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  INFO: 'bg-blue-100 text-blue-800',
  DEBUG: 'bg-gray-100 text-gray-800',
}

const Badge = ({ level }: { level: Level }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelStyles[level] || levelStyles.DEBUG}`}>
    {level}
  </span>
)

function toMillis(log: Partial<AppLog> & { created_at?: string; timestamp?: string }) {
  if (log.created_at) {
    const d = new Date(log.created_at)
    if (!isNaN(d.getTime())) return d.getTime()
  }
  if (log.timestamp) {
    const normalized = log.timestamp.includes('T')
      ? log.timestamp
      : log.timestamp.replace(' ', 'T') + 'Z'
    const d = new Date(normalized)
    if (!isNaN(d.getTime())) return d.getTime()
  }
  return NaN
}

export function ApplicationLogs({ appId }: { appId: string }) {
  const [logs, setLogs] = useState<AppLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [q, setQ] = useState('')
  const [level, setLevel] = useState<'ALL' | Level>('ALL')
  const [time, setTime] = useState<'5m' | '15m' | '1h' | '24h' | '7d'>('24h')
  const [liveTail, setLiveTail] = useState(true)

  const toggleRow = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const getRowKey = (row: AppLog, idx: number) =>
    (row as any).id ?? `${row.timestamp ?? row.created_at ?? ''}-${idx}`

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          setError(null)
          const res = await fetchApplicationLogs(appId)
          const nodes = res?.nodes ?? []
          if (mounted) setLogs(nodes)
        } catch (e: any) {
          if (mounted) setError(e?.message || 'Failed to load logs')
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [appId])

  const filtered = useMemo(() => {
    const now = Date.now()
    const windowMs =
      time === '5m' ? 5 * 60_000 :
        time === '15m' ? 15 * 60_000 :
          time === '1h' ? 60 * 60_000 :
            time === '24h' ? 24 * 60 * 60_000 :
              7 * 24 * 60 * 60_000

    const qLower = q.trim().toLowerCase()

    return logs
      .filter(l => {
        const ts = toMillis(l as any)
        return isFinite(ts) && (now - ts) <= windowMs
      })
      .filter(l => (level === 'ALL' ? true : l.level === level))
      .filter(l =>
        !qLower ? true :
          [l.message, l.source, l.level]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(qLower))
      )
      .sort((a, b) => (toMillis(b as any) - toMillis(a as any)))
  }, [logs, level, q, time])

  const clearAllFilters = () => {
    setQ('')
    setLevel('ALL')
    setTime('24h')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg border border-[#e6dbdb] bg-white p-5 shadow-sm">
        <div>
          <p className="text-[#181111] text-base font-bold leading-tight">Live Tail</p>
          <p className="text-[#896161] text-base">Stream new logs in real-time.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full bg-[#f4f0f0] p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#ec1313]">
            <div className="h-full w-[27px] rounded-full bg-white shadow" />
            <input
              checked={liveTail}
              onChange={(e) => setLiveTail(e.target.checked)}
              className="invisible absolute"
              type="checkbox"
            />
          </label>
          <button className="h-10 px-4 rounded-lg bg-[#ec1313] text-white text-sm font-bold">
            {liveTail ? 'Pause' : 'Resume'}
          </button>
          <button
            className="h-10 px-4 rounded-lg bg-[#f4f0f0] text-[#181111] text-sm font-bold"
            onClick={() => window.location.reload()}
          >
            Clear View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-stretch rounded-lg shadow bg-white p-5 gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              className="w-full rounded-lg border-[#e6dbdb] bg-[#f8f6f6] py-2 pl-10 pr-4 focus:ring-[#ec1313] focus:border-[#ec1313]"
              placeholder="Search logs..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="min-w-[200px] rounded-lg border-[#e6dbdb] bg-[#f8f6f6] py-2 px-3"
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
          >
            <option value="ALL">Level: All</option>
            <option value="INFO">Level: INFO</option>
            <option value="WARN">Level: WARN</option>
            <option value="ERROR">Level: ERROR</option>
            <option value="DEBUG">Level: DEBUG</option>
          </select>

          <select
            className="min-w-[200px] rounded-lg border-[#e6dbdb] bg-[#f8f6f6] py-2 px-3"
            value={time}
            onChange={(e) => setTime(e.target.value as any)}
          >
            <option value="5m">Time: Last 5 minutes</option>
            <option value="15m">Time: Last 15 minutes</option>
            <option value="1h">Time: Last 1 hour</option>
            <option value="24h">Time: Last 24 hours</option>
            <option value="7d">Time: Last 7 days</option>
          </select>

          <button
            className="h-10 px-4 rounded-lg bg-[#ec1313] text-white text-sm font-bold"
            onClick={() => { }}
          >
            Apply Filters
          </button>
          <button
            className="h-10 px-4 rounded-lg bg-[#f4f0f0] text-[#181111] text-sm font-bold"
            onClick={clearAllFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Logs Table (fixed-height container) */}
      <div className="rounded-lg shadow bg-white overflow-hidden">
        {/* FIXED height so page never grows on expand */}
        <div className="h-[70vh] overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Level</th>
                <th className="px-6 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={3} className="px-6 py-4">
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {error ? error : 'No logs to display'}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const ts =
                    row.created_at ??
                    (row.timestamp ? row.timestamp.replace(' ', 'T') + 'Z' : undefined)
                  const key = getRowKey(row, idx)
                  const isOpen = !!expanded[key]

                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        className={`border-b hover:bg-gray-50 cursor-pointer ${isOpen ? 'bg-gray-50' : 'bg-white'}`}
                        onClick={() => toggleRow(key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleRow(key)
                          }
                        }}
                      >
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <svg
                              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M6 6l6 4-6 4V6z" />
                            </svg>
                            {ts ? format(new Date(ts), 'yyyy-MM-dd HH:mm:ss') : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-3"><Badge level={row.level} /></td>
                        <td
                          className="px-6 py-3 max-w-[50vw] truncate"
                          title={row.message}
                        >
                          {row.message}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="border-b bg-gray-50">
                          <td colSpan={3} className="px-6 py-0">
                            {/* Contained, scrollable, WRAPPED text */}
                            <div
                              className="overflow-auto max-h-[40vh] rounded-md border border-gray-200 bg-white p-3"
                            >
                              <div className="text-xs text-gray-500 mb-2">
                                <strong>Level:</strong> {row.level} &nbsp;|&nbsp;
                                <strong>Time:</strong> {ts ? format(new Date(ts), 'yyyy-MM-dd HH:mm:ss.SSS') : '—'}
                              </div>
                              <pre
                                className="whitespace-pre-wrap break-words break-all [text-wrap:anywhere] font-mono text-xs text-gray-800"
                                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                              >
                                {row.message}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}