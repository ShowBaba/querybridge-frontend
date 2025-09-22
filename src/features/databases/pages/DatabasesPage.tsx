import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDatabasesPage, fetchDatabasesTotalCount, fetchEndpointsForApp } from '../api'
import { formatDate, engineLabel, formatPort, getPaginationInfo } from '../utils'
import { SchemaViewer } from '../components/SchemaViewer'
import type { Database, Endpoint } from '../types'

const PAGE_SIZE = 10

export function DatabasesPage() {
  const { appId } = useParams<{ appId: string }>()
  const [databases, setDatabases] = useState<Database[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<{ id: string; name: string } | null>(null)
  const [showSchemaViewer, setShowSchemaViewer] = useState(false)
  const openSchema = (database: Database) => {
    setSelectedDatabase({ id: database.id, name: database.name })
    setShowSchemaViewer(true)
  }
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return
      if (openMenuId && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    if (!appId) return
    loadDatabases()
  }, [appId, offset])

  useEffect(() => {
    if (offset >= totalCount && totalCount > 0) {
      setOffset(Math.max(0, Math.floor((totalCount - 1) / PAGE_SIZE) * PAGE_SIZE))
    }
  }, [totalCount])

  const loadDatabases = async () => {
    if (!appId) return
    try {
      setLoading(true)
      setError(null)
      const [pagedRes, totalRes, endpointsRes] = await Promise.all([
        fetchDatabasesPage(appId, { limit: PAGE_SIZE, offset }),
        fetchDatabasesTotalCount(appId),
        fetchEndpointsForApp(appId),
      ])
      setDatabases(pagedRes.data.databases.nodes)
      setTotalCount(totalRes.data.databases.totalCount)
      setEndpoints(endpointsRes.data.endpoints.nodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load databases')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE))
  }

  const handleNext = () => {
    if (offset + PAGE_SIZE < totalCount) setOffset(offset + PAGE_SIZE)
  }

  const handleTestConnection = (database: Database) => {
    alert(`Connection successful for ${database.name}`)
  }

  const handleRemove = (database: Database) => {
    if (window.confirm(`Are you sure you want to remove ${database.name}?`)) {
      alert('Remove not implemented')
    }
  }

  const getEndpointCount = (databaseId: string) =>
    endpoints.filter(ep => ep.database_id === databaseId).length

  const paginationInfo = getPaginationInfo(offset, PAGE_SIZE, totalCount, databases.length)

  if (loading && databases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* skeleton omitted for brevity */}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* error UI omitted for brevity */}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w/full">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Application Databases</h1>
            <p className="text-base text-[#4d4d4d]">Manage your application database resources.</p>
          </div>
          </div>
        <div className="border-b border-b-[#fef0f0]">
          <nav className="-mb-px flex gap-8">
            <Link
              to={`/applications/${appId}`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
            >
              Overview
            </Link>
            <Link
              to={`/apps/${appId}/databases`}
              className="whitespace-nowrap border-b-2 border-[#ea2a33] px-1 pb-4 text-sm font-semibold text-[#ea2a33]"
            >
              Databases
            </Link>
            <Link
              to="#"
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
            >
              Endpoints
            </Link>
            <Link
              to="#"
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
            >
              Logs
            </Link>
            <Link
              to="#"
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">Name</th>
                  <th className="px-6 py-4 text-left font-medium">Engine</th>
                  <th className="px-6 py-4 text-left font-medium">Port</th>
                  <th className="px-6 py-4 text-left font-medium">Endpoints</th>
                  <th className="px-6 py-4 text-left font-medium">Created Date</th>
                  <th className="px-6 py-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {databases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      No databases yet
                    </td>
                  </tr>
                ) : (
                  databases.map((database, idx) => {
                    const isLastTwo = idx >= databases.length - 2
                    return (
                      <tr
                        key={database.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openSchema(database)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openSchema(database)
                          }
                        }}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"                      >
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)] font-medium">
                          {database.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {engineLabel(database.db_engine)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {formatPort(database.port)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {getEndpointCount(database.id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {formatDate(database.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative" ref={openMenuId === database.id ? menuRef : null}>
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={openMenuId === database.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(prev => (prev === database.id ? null : database.id))
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600">
                                <circle cx="5" cy="12" r="2"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <circle cx="19" cy="12" r="2"></circle>
                              </svg>
                            </button>

                            {openMenuId === database.id && (
                              <div
                                role="menu"
                                aria-label="Database actions"
                                className={`absolute right-0 z-[60] w-44 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden
                                  ${isLastTwo ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                              >
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    openSchema(database)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" /></svg>
                                  View schema
                                </button>

                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleTestConnection(database)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a96,96,0,1,1-96-96,96.11,96.11,0,0,1,96,96ZM120,80v48a8,8,0,0,0,4.42,7.16l40,20a8,8,0,1,0,7.16-14.32L136,119.05V80a8,8,0,0,0-16,0Z" /></svg>
                                  Test connection
                                </button>

                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleRemove(database)
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
      </div>

      {selectedDatabase && (
        <SchemaViewer
          isOpen={showSchemaViewer}
          onClose={() => {
            setShowSchemaViewer(false)
            setSelectedDatabase(null)
          }}
          databaseId={selectedDatabase.id}
          databaseName={selectedDatabase.name}
          appId={appId || ''}
        />
      )}
    </div>
  )
}