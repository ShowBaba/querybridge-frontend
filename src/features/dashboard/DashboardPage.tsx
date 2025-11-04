// dashboard/DashboardPage.tsx
import { useEffect, useMemo, useState } from 'react' // add useMemo
import { useNavigate } from 'react-router-dom'
import { AuditNode, fetchAudits, fetchAuditsTotalCount, fetchDashboard, type DashboardResponse } from './api'
import { ActivityIcon } from './components/ActivityIcon'
import { Avatar } from './components/Avatar'

/** Inline SVG latency chart (no dependencies) */
function LatencyChart({
  points,
  height = 180,
  strokeWidth = 2,
}: {
  points: { ts: string; p50: number; p95?: number | null }[]
  height?: number
  strokeWidth?: number
}) {
  const width = 600 // container will scale; svg viewBox handles responsiveness
  const data = points || []
  const n = data.length

  const { maxY, p50Path, p95Path } = useMemo(() => {
    if (!n) return { maxY: 1, p50Path: '', p95Path: '' }
    const maxCandidate = Math.max(...data.map(d => Math.max(d.p50 ?? 0, d.p95 ?? 0)))
    const maxY = maxCandidate <= 0 ? 1 : Math.ceil(maxCandidate * 1.1)

    const toPath = (vals: number[]) => {
      if (vals.length === 0) return ''
      return vals
        .map((v, i) => {
          const x = (i / Math.max(1, n - 1)) * width
          const y = height - (v / maxY) * height
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
        })
        .join(' ')
    }

    const p50Path = toPath(data.map(d => d.p50 ?? 0))
    const p95Path = toPath(data.map(d => (d.p95 ?? 0)))
    return { maxY, p50Path, p95Path }
  }, [data, height, n, width])

  if (!n) {
    return (
      <div className="h-44 w-full bg-gray-50 flex items-center justify-center rounded-lg text-gray-400 text-sm">
        No latency data
      </div>
    )
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {/* gridlines (4) */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1="0" x2={width} y1={height * t} y2={height * t} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {/* p95 line (lighter) */}
        {p95Path && (
          <path d={p95Path} fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth={strokeWidth} />
        )}
        {/* p50 line (primary) */}
        {p50Path && (
          <path d={p50Path} fill="none" stroke="#111827" strokeWidth={strokeWidth} />
        )}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-[#6b7280]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-6 rounded-full" style={{ background: '#111827' }} />
          P50
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-6 rounded-full" style={{ background: 'rgba(239,68,68,0.7)' }} />
          P95
        </span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [audits, setAudits] = useState<AuditNode[]>([])
  const [auditsTotal, setAuditsTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [auditsLoading, setAuditsLoading] = useState(true)
  const [auditsError, setAuditsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          setAuditsLoading(true); setAuditsError(null)
          const [pageRes, totalRes] = await Promise.all([fetchAudits(limit, offset), fetchAuditsTotalCount()])
          if (cancelled) return
          setAudits(pageRes.nodes ?? [])
          setAuditsTotal(totalRes?.data?.audits?.totalCount ?? 0)
        } catch (e) {
          if (!cancelled) setAuditsError(e instanceof Error ? e.message : 'Failed to load audits')
        } finally {
          if (!cancelled) setAuditsLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [limit, offset])

  useEffect(() => {
    if (auditsTotal <= 0) { if (offset !== 0) setOffset(0); return }
    const lastStart = Math.max(0, Math.floor((auditsTotal - 1) / limit) * limit)
    if (offset > lastStart) setOffset(lastStart)
  }, [auditsTotal, limit])

  const onChangePageSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(parseInt(e.target.value, 10)); setOffset(0)
  }

  const auditsStart = auditsTotal === 0 ? 0 : offset + 1
  const auditsEnd = Math.min(offset + limit, auditsTotal)

  const handleAuditsPrev = () => { if (offset > 0 && !auditsLoading) setOffset(Math.max(0, offset - limit)) }
  const handleAuditsNext = () => { if (offset + limit < auditsTotal && !auditsLoading) setOffset(offset + limit) }

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          setLoading(true); setError(null)
          const res = await fetchDashboard()
          if (!cancelled) setData(res)
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [])

  const auditType = (a: AuditNode) => {
    const et = (a.entity_type || '').toLowerCase().trim()
    const ac = (a.action || '').toLowerCase().trim()
    return et && ac ? `${et}.${ac}` : ac || et || 'activity'
  }

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="mt-3 h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="mt-2 h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">{error}</div>
      </div>
    )
  }

  const name = data?.user?.displayName || 'there'
  const s = data?.summary
  const health = data?.systemHealth
  const latency = data?.performance?.latency
  const latencySeries = latency?.timeseries ?? []

  const StatCard = ({
    title, value, delta, trend = 'up', hasTrend = false, subtitle,
  }: {
    title: string
    value: number | string
    delta?: number
    trend?: 'up' | 'down'
    hasTrend?: boolean
    subtitle?: string
  }) => {
    const isUp = trend !== 'down'
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#6b7280]">{title}</p>
          {hasTrend &&
            (isUp ? (
              <svg className="text-green-500" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.59 5.58L20 12l-8-8-8 8z" />
              </svg>
            ) : (
              <svg className="text-red-500" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4 12l1.41-1.41L11 16.17V4h2v12.17l5.59-5.58L20 12l-8 8-8-8z" />
              </svg>
            ))}
        </div>
        <p className="mt-2 text-3xl font-bold text-[#111827]">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-[#6b7280]">{subtitle}</p>}
        {typeof delta === 'number' && (
          <p className={`mt-2 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? '+' : '-'}{Math.abs(delta)}% <span className="text-[#6b7280]">last hour</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-10 py-8">
      {/* Header with bell + avatar */}
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-[#111827]">Welcome back, {name}</h2>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec1313]"
            onClick={() => navigate('/notifications')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
              <path d="M12 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 006 13h12a1 1 0 00.707-1.707L18 10.586V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {auditsTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-[#ec1313] text-white text-[10px] leading-4 text-center font-bold">
                {auditsTotal > 99 ? '99+' : auditsTotal}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec1313]"
          >
            <Avatar name={name} src={data?.user?.avatarUrl} />
          </button>
        </div>
      </div>

      {/* Quick overview tiles */}
      <section className="mt-6">
        <h3 className="text-xl font-bold text-[#111827]">System Overview</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Applications" value={s?.applications.count ?? 0} hasTrend={false} />
          <StatCard title="Databases" value={s?.databases.count ?? 0} hasTrend={false} />
          <StatCard title="Endpoints" value={s?.endpoints.count ?? 0} hasTrend={false} />
          <StatCard
            title="API Requests"
            value={s?.api_requests.count ?? 0}
            delta={typeof s?.api_requests?.deltaPercent === 'number' ? s?.api_requests?.deltaPercent : undefined}
            trend={s?.api_requests?.trend ?? 'up'}
            hasTrend
          />
        </div>
      </section>

      {/* Reliability only (single column) */}
      <section className="mt-8">
        <h3 className="text-xl font-bold text-[#111827]">Reliability</h3>
        <div className="mt-4 grid grid-cols-1 gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-[#111827]">Request Success vs Errors</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {data?.performance?.latency?.window?.replaceAll('_', ' ') || 'last 60m'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#6b7280]">Success</p>
                <p className="text-2xl font-bold text-[#111827]">
                  {data?.performance?.reliability?.successRatePercent ?? 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6b7280]">Errors</p>
                <p className="text-2xl font-bold text-[#111827]">
                  {data?.performance?.reliability?.errorRatePercent ?? 0}%
                </p>
                <p className="text-xs text-[#6b7280] mt-1">
                  4xx: {data?.performance?.reliability?.errorBreakdown?.x4xx ?? 0}% · 5xx: {data?.performance?.reliability?.errorBreakdown?.x5xx ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Performance */}
      {/* <section className="mt-8">
        <h3 className="text-xl font-bold text-[#111827]">Live Performance Metrics</h3>
        <div className="mt-4 grid grid-cols-1 gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-[#111827]">API Latency (ms)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                bucket: {latency?.bucketSizeSec ?? 60}s
              </span>
            </div>
            <div className="mt-4">
              <LatencyChart points={latencySeries.map(p => ({ ts: p.ts, p50: p.p50, p95: p.p95 }))} />
            </div>
            <p className="mt-4 text-sm text-[#6b7280]">
              Avg: {latency?.average ?? 0}ms · P95: {latency?.p95 ?? 0}ms · P99: {latency?.p99 ?? 0}ms
            </p>
          </div>
        </div>
      </section> */}

      {/* System Health (kept) */}
      {health && (
        <section className="mt-8">
          <h3 className="text-xl font-bold text-[#111827]">System Health</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-base font-medium text-[#6b7280]">API Uptime</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-[#111827]">{health.apiUptimePercent.toFixed(1)}%</p>
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-base font-medium text-[#6b7280]">Error Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-[#111827]">{health.errorRatePercent.toFixed(1)}%</p>
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-base font-medium text-[#6b7280]">Average Latency</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-[#111827]">{health.averageLatencyMs}ms</p>
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top Endpoints (kept) */}
      <section className="mt-8">
        <h3 className="text-xl font-bold text-[#111827]">Top Endpoints</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-[#111827]">Most Active (RPM)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {latency?.window?.replaceAll('_', ' ') || 'last 60m'}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-gray-100">
              {(data?.performance?.topEndpoints ?? []).slice(0, 5).map(ep => (
                <li key={ep.path} className="py-3 flex items-center justify-between">
                  <div className="truncate text-sm text-[#111827]">{ep.path}</div>
                  <div className="text-sm text-[#6b7280]">{ep.rpm} rpm · {ep.avgLatencyMs} ms</div>
                </li>
              ))}
              {(data?.performance?.topEndpoints?.length ?? 0) === 0 && (
                <li className="py-6 text-sm text-[#6b7280]">No request data</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium text-[#111827]">Slowest (Avg)</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">ms</span>
            </div>
            <ul className="mt-4 divide-y divide-gray-100">
              {(data?.performance?.slowestEndpoints ?? []).slice(0, 5).map(ep => (
                <li key={ep.path} className="py-3 flex items-center justify-between">
                  <div className="truncate text-sm text-[#111827]">{ep.path}</div>
                  <div className="text-sm text-[#6b7280]">
                    {ep.avgLatencyMs} ms{typeof ep.p95LatencyMs === 'number' ? ` · P95 ${ep.p95LatencyMs} ms` : ''}
                  </div>
                </li>
              ))}
              {(data?.performance?.slowestEndpoints?.length ?? 0) === 0 && (
                <li className="py-6 text-sm text-[#6b7280]">No latency data</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Activity & Alerts (kept) */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#111827]">Activity & Alerts</h3>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={onChangePageSize} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-sm">
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flow-root rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {auditsLoading ? (
            <ul className="-my-4 divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </li>
              ))}
            </ul>
          ) : auditsError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{auditsError}</div>
          ) : audits.length === 0 ? (
            <div className="py-8 text-center text-[#6b7280]">No audit events</div>
          ) : (
            <>
              <ul className="-my-4 divide-y divide-gray-200">
                {audits.map((a) => {
                  const title = a.description || `${(a.action || '').replace(/_/g, ' ')} ${(a.entity_type || '').replace(/_/g, ' ')}`.trim()
                  const subtitle = a.ago || (a.created_at ? new Date(a.created_at).toLocaleString() : '')
                  return (
                    <li key={a.id} className="flex items-center gap-4 py-4">
                      <ActivityIcon severity={null} type={auditType(a)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#111827]">{title}</p>
                        <p className="text-xs text-[#6b7280]">
                          {subtitle}{a.username ? ` · ${a.username}` : ''}{a.ip_address ? ` · ${a.ip_address}` : ''}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="flex items-center justify-between px-2 py-3 border-t border-gray-200 mt-4">
                <div className="text-sm text-[#6b7280]">
                  Showing <span className="font-semibold text-[#111827]">{auditsStart}</span> to{' '}
                  <span className="font-semibold text-[#111827]">{auditsEnd}</span> of{' '}
                  <span className="font-semibold text-[#111827]">{auditsTotal}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleAuditsPrev} disabled={offset === 0 || auditsLoading}
                    className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button onClick={handleAuditsNext} disabled={offset + limit >= auditsTotal || auditsLoading}
                    className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white px-6 py-4 mt-8 rounded-lg">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-[#6b7280] sm:flex-row">
          <p>© 2024 QueryBridge. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-[#ec1313]" href="#">Terms of Service</a>
            <a className="hover:text-[#ec1313]" href="#">Privacy Policy</a>
            <a className="hover:text-[#ec1313]" href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}