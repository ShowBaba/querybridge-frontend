import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { fetchApplicationsPage, fetchApplicationsTotalCount, createApplication,
  deleteApplication, updateApplication, searchApplications } from '../api'
import { Application } from '../types'
import { getPaginationInfo } from '@/lib/utils'

const PAGE_SIZE = 9

export function ApplicationsList() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({})
  const [epCounts, setEpCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [appName, setAppName] = useState('')
  const [appKey, setAppKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [openAppMenuId, setOpenAppMenuId] = useState<string | null>(null)
  const appMenuRef = useRef<HTMLDivElement | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null)

  const [confirmApp, setConfirmApp] = useState<Application | null>(null)
  const [removing, setRemoving] = useState(false)

  const [showEdit, setShowEdit] = useState(false)
  const [editApp, setEditApp] = useState<Application | null>(null)
  const [editName, setEditName] = useState('')
  const [editKey, setEditKey] = useState('')
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const skipSearchEffect = useRef(true)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (openAppMenuId && appMenuRef.current && !appMenuRef.current.contains(e.target as Node)) {
        setOpenAppMenuId(null)
        setMenuCoords(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openAppMenuId])

  useEffect(() => { load() }, [offset])

  useEffect(() => {
    // Skip the initial mount — offset effect already loads the list
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false
      return
    }

    const timeout = setTimeout(async () => {
      if (searchTerm.trim() === '') {
        await load()
      } else {
        try {
          setLoading(true)
          const results = await searchApplications(searchTerm.trim())
          setApplications(results)
          setTotalCount(results.length)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to search applications')
        } finally {
          setLoading(false)
        }
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    if (offset >= totalCount && totalCount > 0) {
      setOffset(Math.max(0, Math.floor((totalCount - 1) / PAGE_SIZE) * PAGE_SIZE))
    }
  }, [totalCount])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pageRes, totalRes] = await Promise.all([
        fetchApplicationsPage({ limit: PAGE_SIZE, offset }),
        fetchApplicationsTotalCount(),
      ])

      const apps = pageRes.data.applications?.nodes ?? []
      const dbs = pageRes.data.databases?.nodes ?? []
      const eps = pageRes.data.endpoints?.nodes ?? []

      const dbMap: Record<string, number> = {}
      for (const d of dbs) dbMap[d.application_id] = (dbMap[d.application_id] ?? 0) + 1
      const epMap: Record<string, number> = {}
      for (const e of eps) epMap[e.application_id] = (epMap[e.application_id] ?? 0) + 1

      setApplications(apps)
      setDbCounts(dbMap)
      setEpCounts(epMap)
      setTotalCount(totalRes.data.applications.totalCount ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => { if (offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE)) }
  const handleNext = () => { if (offset + PAGE_SIZE < totalCount) setOffset(offset + PAGE_SIZE) }

  const paginationInfo = getPaginationInfo(offset, PAGE_SIZE, totalCount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      return true
    } catch {
      return false
    }
  }

  const handleCopy = async (id: string, apiKey: string) => {
    const ok = await copyToClipboard(apiKey)
    if (ok) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }

  const handleApplicationClick = (appId: string) => {
    navigate(`/applications/${appId}`)
  }

  const openCreateModal = () => { setCreateError(null); setAppName(''); setAppKey(''); setShowCreate(true) }
  const closeCreateModal = () => { if (!creating) setShowCreate(false) }
  const autoGenerateKey = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    setAppKey(`sk-${rand.slice(0, 24)}-${rand.slice(-8)}`)
  }
  const submitCreate = async () => {
    if (!appName.trim() || !appKey.trim()) {
      setCreateError('Please provide both Application Name and App Key.')
      return
    }
    try {
      setCreating(true)
      setCreateError(null)
      await createApplication({ name: appName.trim(), api_key: appKey.trim() })
      setShowCreate(false)
      setOffset(0)
      await load()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create application')
    } finally {
      setCreating(false)
    }
  }

  const onOpenApp = (app: Application) => {
    setOpenAppMenuId(null); setMenuCoords(null)
    navigate(`/applications/${app.id}`)
  }

  const onDeleteApp = (app: Application) => {
    setOpenAppMenuId(null); setMenuCoords(null)
    setConfirmApp(app)
  }

  const onEditApp = (app: Application) => {
    setOpenAppMenuId(null); setMenuCoords(null)
    setEditApp(app)
    setEditName(app.name || '')
    setEditKey(app.api_key || '')
    setEditError(null)
    setShowEdit(true)
  }

  const closeEditModal = () => { if (!editing) setShowEdit(false) }

  const autoGenerateEditKey = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    setEditKey(`sk-${rand.slice(0, 24)}-${rand.slice(-8)}`)
  }

  const submitEdit = async () => {
    if (!editApp) return
    if (!editName.trim() || !editKey.trim()) {
      setEditError('Please provide both Application Name and App Key.')
      return
    }
    try {
      setEditing(true)
      setEditError(null)
      await updateApplication(editApp.id, { name: editName.trim(), api_key: editKey.trim() })
      setShowEdit(false)
      await load()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setEditing(false)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 px-10 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Applications</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg aria-hidden="true" className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" />
              </svg>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search applications…"
              className="block w-64 md:w-80 px-4 py-2 border border-[#fef0f0] rounded-lg bg-gray-50 text-[#1a1a1a] placeholder-[#4d4d4d]
                 focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:border-[#ea2a33] transition ease-in-out duration-150 pl-10"
              type="text"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-2 my-auto h-7 w-7 rounded hover:bg-gray-200 text-gray-500 flex items-center justify-center"
                aria-label="Clear search"
                title="Clear"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95 1.414-1.414z" />
                </svg>
              </button>
            )}
          </div>

          <button
            className="bg-[#ea2a33] text-white px-6 py-2.5 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:ring-opacity-50 transition ease-in-out duration-150 flex items-center gap-2"
            onClick={openCreateModal}
            type="button"
          >
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
            </svg>
            <span>New Application</span>
          </button>
        </div>
      </header>

      <div className="p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

 

        {/* Cards / Empty state */}
        <div className="min-h-[12rem]">
          {/* Loading skeletons — only when there is no existing data to keep on screen */}
          {loading && applications.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-40" />
              ))}
            </div>
          )}

          {/* Empty state (no results on load or after search) */}
          {!loading && applications.length === 0 && (
            <div className="flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor" aria-hidden="true">
                    <path d="M19 3H5a2 2 0 0 0-2 2v12a4 4 0 0 0 4 4h9a5 5 0 0 0 5-5V5a2 2 0 0 0-2-2Zm0 14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5h15v12ZM8 8h8v2H8V8Zm0 4h6v2H8v-2Z" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  {searchTerm.trim()
                    ? <>No results for “{searchTerm.trim()}”</>
                    : 'No applications yet'}
                </h3>

                <p className="mt-2 text-sm text-[#4d4d4d]">
                  {searchTerm.trim()
                    ? 'Try a different search or clear the search to see all applications.'
                    : 'Create your first application to get started.'}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear search
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#ea2a33] px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 256 256" aria-hidden="true">
                      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
                    </svg>
                    New Application
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cards grid — keep visible while refreshing so navigation/search doesn't blink */}
          {applications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => {
                const isCopied = copiedId === app.id
                const dbCount = dbCounts[app.id] ?? 0
                const epCount = epCounts[app.id] ?? 0

                return (
                  <div
                    key={app.id}
                    className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    onClick={() => handleApplicationClick(app.id)}
                  >
                    <div className="absolute top-3 right-3 z-10 pointer-events-auto">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={openAppMenuId === app.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setOpenAppMenuId(prev => {
                            const willOpen = prev !== app.id
                            if (willOpen) {
                              setMenuCoords({ top: rect.bottom, right: window.innerWidth - rect.right })
                            } else {
                              setMenuCoords(null)
                            }
                            return willOpen ? app.id : null
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
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1a1a1a] mb-2 pr-10">{app.name}</h3>
                      <div className="flex items-center text-[#4d4d4d] text-sm space-x-4 mb-4">
                        <span><strong className="text-[#1a1a1a]">{dbCount}</strong> Databases</span>
                        <span><strong className="text-[#1a1a1a]">{epCount}</strong> Endpoints</span>
                      </div>

                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="text-sm text-[#4d4d4d] font-mono">
                          {app.api_key && app.api_key.length > 8
                            ? `sk-${'•'.repeat(5)}-${app.api_key.slice(-4)}`
                            : app.api_key}
                        </span>
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-gray-200 relative"
                          aria-label={isCopied ? 'Copied' : 'Copy API key'}
                          title={isCopied ? 'Copied!' : 'Copy'}
                          onClick={(e) => { e.stopPropagation(); handleCopy(app.id, app.api_key) }}
                        >
                          {isCopied ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-green-600">
                              <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                            </svg>
                          ) : (
                            <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                              <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                            </svg>
                          )}
                          {isCopied && (
                            <span className="absolute -top-7 right-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                              Copied
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-4">Created: {formatDate(app.created_at)}</p>

                    {openAppMenuId === app.id && menuCoords && createPortal(
                      <div
                        ref={appMenuRef}
                        role="menu"
                        aria-label="Application actions"
                        className="fixed z-[9999] w-44 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
                        style={{ top: menuCoords.top + 8, right: menuCoords.right }}
                        onClick={(ev) => ev.stopPropagation()}
                        onMouseDown={(ev) => ev.stopPropagation()}
                      >
                        <button
                          role="menuitem"
                          onClick={(e) => { e.stopPropagation(); onOpenApp(app) }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" /></svg>
                          Open
                        </button>
                        <button
                          role="menuitem"
                          onClick={(e) => { e.stopPropagation(); onEditApp(app) }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66,178.34,26.34a8,8,0,0,0-11.31,0L57.37,136a8,8,0,0,0-2.11,3.73L48.06,181a8,8,0,0,0,9.21,9.21l41.25-7.2a8,8,0,0,0,3.73-2.11L229.66,88.97A8,8,0,0,0,229.66,77.66Z" /></svg>
                          Edit
                        </button>
                        <button
                          role="menuitem"
                          onClick={(e) => { e.stopPropagation(); onDeleteApp(app) }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" /></svg>
                          Delete
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>


        {totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white mt-6 rounded-b-xl">
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

      {showCreate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
          onClick={() => {
            if (!creating) closeCreateModal()
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-card-dark rounded-xl shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()} 
          >
            <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border-dark">
              <h2 className="text-xl font-bold text-[#111827] dark:text-foreground-dark">Add New Application</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-[#111827] dark:text-placeholder-dark dark:hover:text-foreground-dark"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <main className="p-6 space-y-6">
              {createError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827] dark:text-foreground-dark" htmlFor="appName">
                  Application Name
                </label>
                <input
                  id="appName"
                  type="text"
                  placeholder="Enter application name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg placeholder:text-[#9ca3af] dark:placeholder:text-placeholder-dark text-[#111827] dark:text-foreground-dark focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827] dark:text-foreground-dark" htmlFor="appKey">
                  App Key
                </label>
                <div className="relative">
                  <input
                    id="appKey"
                    type="text"
                    placeholder="e.g., a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg placeholder:text-[#9ca3af] dark:placeholder:text-placeholder-dark text-[#111827] dark:text-foreground-dark focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] transition-colors pr-28"
                  />
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); autoGenerateKey() }}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-[#ec1313] underline hover:text-[#ec1313]/80"
                  >
                    Auto generate
                  </a>
                </div>
              </div>
            </main>

            <footer className="p-6">
              <button
                onClick={submitCreate}
                disabled={creating}
                className="w-full bg-[#ec1313] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#ec1313]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-card-dark focus:ring-[#ec1313] disabled:opacity-50"
              >
                {creating ? 'Adding…' : 'Add Application'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {confirmApp && createPortal(
        <div className="fixed inset-0 z-[10000]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !removing && setConfirmApp(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Delete application</h3>
                <p className="mt-1 text-sm text-[#4d4d4d]">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-[#1a1a1a]">{confirmApp.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => setConfirmApp(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={removing}
                  onClick={async () => {
                    if (!confirmApp) return
                    try {
                      setRemoving(true)
                      await deleteApplication(confirmApp.id)
                      const willBeCount = totalCount - 1
                      if (applications.length === 1 && offset > 0 && offset >= willBeCount) {
                        setOffset(Math.max(0, offset - PAGE_SIZE))
                      }
                      setConfirmApp(null)
                      await load()
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to delete application')
                    } finally {
                      setRemoving(false)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#ea2a33] px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removing ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                      </svg>
                      Removing…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                        <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
                      </svg>
                      Remove
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showEdit && editApp && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
          onClick={() => { if (!editing) closeEditModal() }}
        >
          <div
            className="bg-white dark:bg-card-dark rounded-xl shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border-dark">
              <h2 className="text-xl font-bold text-[#111827] dark:text-foreground-dark">Edit Application</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-[#111827] dark:text-placeholder-dark dark:hover:text-foreground-dark"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <main className="p-6 space-y-6">
              {editError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {editError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827] dark:text-foreground-dark" htmlFor="editName">
                  Application Name
                </label>
                <input
                  id="editName"
                  type="text"
                  placeholder="Enter application name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg placeholder:text-[#9ca3af] dark:placeholder:text-placeholder-dark text-[#111827] dark:text-foreground-dark focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827] dark:text-foreground-dark" htmlFor="editKey">
                  App Key
                </label>
                <div className="relative">
                  <input
                    id="editKey"
                    type="text"
                    placeholder="e.g., a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg placeholder:text-[#9ca3af] dark:placeholder:text-placeholder-dark text-[#111827] dark:text-foreground-dark focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] transition-colors pr-28"
                  />
                  <a
                    href="#"
                    onClick={autoGenerateEditKey}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-[#ec1313] underline hover:text-[#ec1313]/80"
                  >
                    Auto generate
                  </a>
                </div>
              </div>
            </main>

            <footer className="p-6">
              <button
                onClick={submitEdit}
                disabled={editing}
                className="w-full bg-[#ec1313] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#ec1313]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-card-dark focus:ring-[#ec1313] disabled:opacity-50"
              >
                {editing ? 'Saving…' : 'Save Changes'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}