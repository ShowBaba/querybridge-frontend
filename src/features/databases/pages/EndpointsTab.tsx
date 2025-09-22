import { useEffect, useState, useRef } from 'react'
import { fetchEndpointsPage, fetchEndpointsTotalCount } from '../api'
import { getPaginationInfo, formatDate } from '../utils'
import type { Endpoint } from '../types'

const PAGE_SIZE = 10

type Database = { id: string; name: string }

type EndpointsTabProps = { appId: string }

export function EndpointsTab({ appId }: EndpointsTabProps) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [databases, setDatabases] = useState<Database[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!appId) return
    loadEndpoints()
  }, [appId, offset])

  useEffect(() => {
    if (offset >= totalCount && totalCount > 0) {
      setOffset(Math.max(0, Math.floor((totalCount - 1) / PAGE_SIZE) * PAGE_SIZE))
    }
  }, [totalCount])

  const loadEndpoints = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pagedRes, totalRes] = await Promise.all([
        fetchEndpointsPage(appId, { limit: PAGE_SIZE, offset }),
        fetchEndpointsTotalCount(appId),
      ])
      setEndpoints(pagedRes.data.endpoints.nodes)
      setDatabases(pagedRes.data.databases.nodes)
      setTotalCount(totalRes.data.endpoints.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoints')
    } finally {
      setLoading(false)
    }
  }

  const getDatabaseName = (dbId: string | null) => {
    if (!dbId) return '—'
    const db = databases.find(d => d.id === dbId)
    return db ? db.name : dbId.slice(-6)
  }

  const getTarget = (endpoint: Endpoint) => {
    const db = getDatabaseName(endpoint.database_id)
    const tbl = endpoint.table_id ? endpoint.table_id.slice(-6) : '—'
    return db + (endpoint.table_id ? ` / ${tbl}` : '')
  }

  const handlePrevious = () => {
    if (offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE))
  }
  const handleNext = () => {
    if (offset + PAGE_SIZE < totalCount) setOffset(offset + PAGE_SIZE)
  }

  const handleViewDetails = (endpoint: Endpoint) => {
    alert(`View details for endpoint: ${endpoint.name}`)
  }
  const handleCopyId = (endpoint: Endpoint) => {
    navigator.clipboard.writeText(endpoint.id)
    alert('Copied')
  }
  const handleRemove = (endpoint: Endpoint) => {
    if (window.confirm(`Are you sure you want to remove ${endpoint.name}?`)) {
      alert('Remove not implemented')
    }
  }

  const paginationInfo = getPaginationInfo(offset, PAGE_SIZE, totalCount, endpoints.length)

  if (loading && endpoints.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Name</th>
                <th className="px-6 py-4 text-left font-medium">Visibility</th>
                <th className="px-6 py-4 text-left font-medium">Target</th>
                <th className="px-6 py-4 text-left font-medium">Order</th>
                <th className="px-6 py-4 text-left font-medium">Limit</th>
                <th className="px-6 py-4 text-left font-medium">Created</th>
                <th className="px-6 py-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-200">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4" role="alert" aria-live="polite">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading endpoints</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadEndpoints}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Name</th>
              <th className="px-6 py-4 text-left font-medium">Visibility</th>
              <th className="px-6 py-4 text-left font-medium">Target</th>
              <th className="px-6 py-4 text-left font-medium">Order</th>
              <th className="px-6 py-4 text-left font-medium">Limit</th>
              <th className="px-6 py-4 text-left font-medium">Created</th>
              <th className="px-6 py-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                  No endpoints yet
                </td>
              </tr>
            ) : (
              endpoints.map((endpoint, idx) => {
                const isLastTwo = idx >= endpoints.length - 2
                return (
                  <tr
                    key={endpoint.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewDetails(endpoint)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleViewDetails(endpoint)
                      }
                    }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)] font-medium">
                      {endpoint.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${endpoint.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {endpoint.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {getTarget(endpoint)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {endpoint.order_by ? `${endpoint.order_by} ${endpoint.order_direction || ''}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {endpoint.limit ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                      {formatDate(endpoint.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative" ref={openMenuId === endpoint.id ? menuRef : null} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === endpoint.id}
                          onClick={e => {
                            e.stopPropagation()
                            setOpenMenuId(prev => (prev === endpoint.id ? null : endpoint.id))
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600">
                            <circle cx="5" cy="12" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="19" cy="12" r="2"></circle>
                          </svg>
                        </button>
                        {openMenuId === endpoint.id && (
                          <div
                            role="menu"
                            aria-label="Endpoint actions"
                            className={`absolute right-0 z-[60] w-44 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden
                              ${isLastTwo ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleViewDetails(endpoint)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" /></svg>
                              View details
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleCopyId(endpoint)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path></svg>
                              Copy ID
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null)
                                handleRemove(endpoint)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" /></svg>
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.start}</span> to{' '}
            <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.end}</span> of{' '}
            <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!paginationInfo.hasPrevious}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
              type="button"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!paginationInfo.hasNext}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
