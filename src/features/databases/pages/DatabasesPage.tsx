import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  fetchDatabasesPage,
  fetchDatabasesTotalCount,
  fetchEndpointsForApp,
  deleteDatabase,
  testDatabaseConnectivity
} from '../api'
import { formatDate, engineLabel } from '../utils'
import { getPaginationInfo } from '@/lib/utils'

import { SchemaViewer } from '../components/SchemaViewer'
import type { Database, Endpoint } from '../types'
import { useToast } from '@/components/ui/Toast'
import { ActionsButton } from '@/features/applications/components/ActionsButton'
import { DatabaseFormModal } from '../components/DatabaseFormModal'
import { EndpointFormModal } from '@/features/endpoints/components/EndpointFormModal'

const PAGE_SIZE = 10

export function DatabasesPage() {
  const { appId } = useParams<{ appId: string }>()
  const [databases, setDatabases] = useState<Database[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<{ id: string; name: string } | null>(null)
  const [showSchemaViewer, setShowSchemaViewer] = useState(false)


  const [confirmDb, setConfirmDb] = useState<Database | null>(null)
  const [removing, setRemoving] = useState(false)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null)
  const [openCreateEndpoint, setOpenCreateEndpoint] = useState(false)

  const onCreateEndpoint = () => setOpenCreateEndpoint(true)
  const navigate = useNavigate()

  // const onAddEndpoint = () => navigate(`/applications/${appId}/endpoints?create=1`)

  const [showCreateDb, setShowCreateDb] = useState(false)
  const [editDb, setEditDb] = useState<Database | null>(null)

  const [statusMap, setStatusMap] = useState<Record<string, 'checking' | 'up' | 'down' | 'error'>>({})
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
        setMenuCoords(null)
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
      setLoadError(null)
      const [pagedRes, totalRes, endpointsRes] = await Promise.all([
        fetchDatabasesPage(appId, { limit: PAGE_SIZE, offset }),
        fetchDatabasesTotalCount(appId),
        fetchEndpointsForApp(appId),
      ])
      const rows = pagedRes.data.databases.nodes
      setDatabases(rows)
      setTotalCount(totalRes.data.databases.totalCount)
      setEndpoints(endpointsRes.data.endpoints.nodes)
      const next: Record<string, 'checking' | 'up' | 'down' | 'error'> = {}
      rows.forEach(d => { next[d.id] = 'checking' })
      setStatusMap(next)

      await Promise.all(rows.map(async (d) => {
        try {
          const ok = await testDatabaseConnectivity(d.id)
          setStatusMap(prev => ({ ...prev, [d.id]: ok ? 'up' : 'down' }))
        } catch {
          setStatusMap(prev => ({ ...prev, [d.id]: 'error' }))
        }
      }))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load databases')
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


  const { success, error: toastError } = useToast()
  const handleRemove = async (database: Database) => {
    setRemoving(true)
    setOpenMenuId(null)
    setMenuCoords(null)
    try {
      await deleteDatabase(database.id)
      success(`${database.name} removed successfully`)
      await loadDatabases()
      setConfirmDb(null)
    } catch (err) {
      toastError('Failed to remove database')
    } finally {
      setRemoving(false)
    }
  }

  const getEndpointCount = (databaseId: string) =>
    endpoints.filter((ep) => ep.database_id === databaseId).length

  const paginationInfo = getPaginationInfo(offset, PAGE_SIZE, totalCount, databases.length)

  if (loading && databases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w/full">
        {/* skeleton omitted for brevity */}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w/full">
        {/* error UI omitted for brevity */}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w/full">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/applications")}
              className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mr-3"
            >
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H69.66l34.17,34.17a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48a8,8,0,1,1,11.32,11.32L69.66,120H216A8,8,0,0,1,224,128Z" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Application Databases</h1>
            <p className="text-base text-[#4d4d4d]">Manage your application database resources.</p>
          </div>
          <ActionsButton
            items={[
              {
                label: 'Add database',
                onClick: () => setShowCreateDb(true), icon: (
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
                  </svg>
                ),
              },
              {
                label: 'Create endpoint',
                onClick: onCreateEndpoint,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" />
                  </svg>
                ),
              },
            ]}
          />
          <DatabaseFormModal
            isOpen={showCreateDb}
            mode="create"
            appId={appId!}
            onClose={() => setShowCreateDb(false)}
            onSaved={loadDatabases}
          />
          <EndpointFormModal
            isOpen={openCreateEndpoint}
            mode="create"
            appId={appId!}
            onClose={() => setOpenCreateEndpoint(false)}
            onSaved={() => {
              setOpenCreateEndpoint(false)
              loadDatabases()
            }} databaseId={''} />
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
              to={`/applications/${appId}/databases`}
              className="whitespace-nowrap border-b-2 border-[#ea2a33] px-1 pb-4 text-sm font-semibold text-[#ea2a33]"
            >
              Databases
            </Link>
            <Link
              to={`/applications/${appId}/endpoints`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]">
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
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-left font-medium">Endpoints</th>
                  <th className="px-6 py-4 text-left font-medium">Created Date</th>
                  <th className="px-6 py-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {databases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text[--text-secondary]">
                      No databases yet
                    </td>
                  </tr>
                ) : (
                  databases.map((database, idx) => {
                    const isLastTwo = idx >= databases.length - 2
                    const rowStatus: 'checking' | 'up' | 'down' | 'error' =
                      statusMap[database.id] ?? 'checking'

                    const StatusBadge = () => {
                      if (rowStatus === 'checking') {
                        return (
                          <div className="inline-flex items-center gap-2">
                            <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />
                          </div>
                        )
                      }
                      if (rowStatus === 'up') {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" /></svg>
                            Connected
                          </span>
                        )
                      }
                      if (rowStatus === 'down') {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95 1.414-1.414z" /></svg>
                            Unreachable
                          </span>
                        )
                      }
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                          Error
                        </span>
                      )
                    }
                    return (
                      <tr
                        key={database.id}
                        role="button"
                        tabIndex={0}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/applications/${appId}/databases/${database.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-primary)] font-medium">
                          {database.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {engineLabel(database.db_engine)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge />
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
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                setOpenMenuId((prev) => {
                                  const willOpen = prev !== database.id
                                  if (willOpen) {
                                    setMenuCoords({ top: rect.bottom, right: window.innerWidth - rect.right })
                                  } else {
                                    setMenuCoords(null)
                                  }
                                  return willOpen ? database.id : null
                                })
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600">
                                <circle cx="5" cy="12" r="2"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <circle cx="19" cy="12" r="2"></circle>
                              </svg>
                            </button>

                            {openMenuId === database.id &&
                              menuCoords &&
                              createPortal(
                                <div
                                  ref={menuRef}
                                  role="menu"
                                  aria-label="Database actions"
                                  className="fixed z-[9999] w-44 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
                                  style={{
                                    top: isLastTwo ? menuCoords.top - 8 : menuCoords.top + 8,
                                    right: menuCoords.right,
                                    transform: isLastTwo ? 'translateY(-100%)' : 'none',
                                  }}
                                  onClick={(ev) => ev.stopPropagation()}
                                  onMouseDown={(ev) => ev.stopPropagation()}
                                >
                                  <button
                                    role="menuitem"
                                    onClick={() => navigate(`/applications/${appId}/databases/${database.id}`)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                                      <path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" />
                                    </svg>
                                    View
                                  </button>

                                  <button
                                    role="menuitem"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenMenuId(null)
                                      setMenuCoords(null)
                                      setEditDb(database)
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                                      <path d="M229.66,77.66,178.34,26.34a8,8,0,0,0-11.31,0L57.37,136a8,8,0,0,0-2.11,3.73L48.06,181a8,8,0,0,0,9.21,9.21l41.25-7.2a8,8,0,0,0,3.73-2.11L229.66,88.97A8,8,0,0,0,229.66,77.66Z" />
                                    </svg>
                                    Edit
                                  </button>



                                  <button
                                    role="menuitem"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setOpenMenuId(null)
                                      setMenuCoords(null)
                                      setConfirmDb(database)
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                                      <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
                                    </svg>
                                    Remove
                                  </button>
                                </div>,
                                document.body
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

      {confirmDb &&
        createPortal(
          <div className="fixed inset-0 z-[10000]">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => !removing && setConfirmDb(null)}
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-[#1a1a1a]">Remove database</h3>
                  <p className="mt-1 text-sm text-[#4d4d4d]">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-[#1a1a1a]">{confirmDb.name}</span>? This action cannot be
                    undone.
                  </p>
                </div>

                <div className="px-6 py-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => setConfirmDb(null)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirmDb) handleRemove(confirmDb)
                    }}
                    disabled={removing}
                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#ea2a33] px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {removing ? (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                        <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
                      </svg>
                    )}
                    {removing ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      {editDb && (
        <DatabaseFormModal
          isOpen={!!editDb}
          mode="edit"
          dbId={editDb.id}
          initial={{
            name: editDb.name ?? '',
            host: editDb.host ?? '',
            port: editDb.port ?? 5432,
            database: editDb.database ?? '',
            username: editDb.username ?? '',
            password: '',
            db_engine: (editDb.db_engine as any) ?? 'postgres',
            ssl_mode: (editDb.ssl_mode as any) ?? 'disable',
          }}
          onClose={() => setEditDb(null)}
          onSaved={async () => { setEditDb(null); await loadDatabases() }}
        />
      )}
    </div>
  )
}