import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { fetchUserApplications, fetchDatabasesPage } from '@/features/databases/api'
import { deleteEndpoint, fetchEndpoints } from '@/features/endpoints/api'
import type { Endpoint } from '@/features/endpoints/types'
import type { Database } from '@/features/databases/types'
import { EndpointFormModal } from '../components/EndpointFormModal'
import { getPaginationInfo } from '@/lib/utils'
import { MethodBadge } from '../components/EndpointMethodBadge'

const PAGE_SIZE = 10

type Row = {
  id: string
  name: string
  method: string
  application_id: string
  database_id: string
  created_at: string
}



export function EndpointList() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [apps, setApps] = useState<Array<{ id: string; name: string }>>([])
  const [dbNameById, setDbNameById] = useState<Map<string, string>>(new Map())

  const [searchTerm, setSearchTerm] = useState('')
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const [offset, setOffset] = useState(0)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [chooseAppOpen, setChooseAppOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createAppId, setCreateAppId] = useState<string>('')

  const [filterOpen, setFilterOpen] = useState(false)
  const filterCardRef = useRef<HTMLDivElement | null>(null)
  const [filterApp, setFilterApp] = useState<string>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterDb, setFilterDb] = useState<string>('all')

  const [confirmEp, setConfirmEp] = useState<Row | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null); setMenuCoords(null)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [openMenuId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFilterOpen(false)
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (filterOpen && filterCardRef.current && !filterCardRef.current.contains(t)) setFilterOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [filterOpen])

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => {
      clampOffset()
    }, 350)
    setTypingTimeout(timeout)
  }, [searchTerm])

  async function handleDelete(ep: Row) {
    try {
      setRemoving(true)
      await deleteEndpoint(ep.id)
      setRows(prev => prev.filter(r => r.id !== ep.id))
      setConfirmEp(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete endpoint'
      alert(msg)
    } finally {
      setRemoving(false)
    }
  }

  async function load() {
    try {
      setLoading(true)
      setLoadError(null)

      const appsRes = await fetchUserApplications()
      const appNodes = appsRes.data.applications.nodes ?? []
      setApps(appNodes)

      const allEndpoints: Endpoint[] = []
      await Promise.all(
        appNodes.map(async (a) => {
          const epRes = await fetchEndpoints(a.id, 1000, 0)
          const eps = epRes.data.endpoints.nodes ?? []
          allEndpoints.push(...eps)
        })
      )

      const dbMap = new Map<string, string>()
      await Promise.all(
        appNodes.map(async (a) => {
          const dbRes = await fetchDatabasesPage(a.id, { limit: 1000, offset: 0 })
          const dbs: Database[] = dbRes.data.databases.nodes ?? []
          dbs.forEach(d => dbMap.set(d.id, d.name))
        })
      )
      setDbNameById(dbMap)

      const normalized: Row[] = allEndpoints
        .sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
        .map(e => ({
          id: e.id,
          name: e.name,
          method: e.method || 'GET',
          application_id: String(e.application_id),
          database_id: String(e.database_id),
          created_at: e.created_at,
        }))

      setRows(normalized)
      setOffset(0)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load endpoints')
    } finally {
      setLoading(false)
    }
  }

  const methodOptions = useMemo(() => {
    const s = new Set(rows.map(r => r.method).filter(Boolean))
    return Array.from(s)
  }, [rows])

  const dbOptions = useMemo(() => {
    const ids = Array.from(new Set(rows.map(r => r.database_id).filter(Boolean)))
    const list = ids.map(id => ({ id, name: dbNameById.get(id) || id }))
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [rows, dbNameById])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return rows.filter(r => {
      const appMatch = filterApp === 'all' ? true : r.application_id === filterApp
      const methodMatch = filterMethod === 'all' ? true : r.method === filterMethod
      const dbMatch = filterDb === 'all' ? true : r.database_id === filterDb
      const textMatch = !term
        ? true
        : (() => {
          const appName = apps.find(a => a.id === r.application_id)?.name || ''
          const dbName = dbNameById.get(r.database_id) || ''
          return (
            r.name.toLowerCase().includes(term) ||
            r.method.toLowerCase().includes(term) ||
            appName.toLowerCase().includes(term) ||
            dbName.toLowerCase().includes(term)
          )
        })()
      return appMatch && methodMatch && dbMatch && textMatch
    })
  }, [rows, searchTerm, apps, dbNameById, filterApp, filterMethod, filterDb])

  useEffect(() => { clampOffset() }, [filtered.length])
  function clampOffset() {
    const total = filtered.length
    if (total === 0) { setOffset(0); return }
    const maxOffset = Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE
    if (offset > maxOffset) setOffset(maxOffset)
  }

  const pageRows = useMemo(() => filtered.slice(offset, offset + PAGE_SIZE), [filtered, offset])
  const paginationInfo = useMemo(
    () => getPaginationInfo(offset, PAGE_SIZE, filtered.length),
    [offset, filtered.length, pageRows.length]
  )

  const handlePrevious = () => { if (offset > 0) setOffset(Math.max(0, offset - PAGE_SIZE)) }
  const handleNext = () => { if (offset + PAGE_SIZE < filtered.length) setOffset(offset + PAGE_SIZE) }

  if (loading && rows.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-8 w/full">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-10 py-8 w/full">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-sm text-red-700">{loadError}</div>
        </div>
      </div>
    )
  }

  const hasSearch = !!searchTerm.trim()
  const hasFilters = filterApp !== 'all' || filterMethod !== 'all' || filterDb !== 'all'

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex items-center justify-between border-b border-gray-200 px-10 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Endpoints</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg aria-hidden="true" className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
              </svg>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search endpoints…"
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
            type="button"
            className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[var(--text-secondary)]"
            aria-label="Filter endpoints"
            onClick={() => setFilterOpen(true)}
          >
            <svg fill="currentColor" height="20px" width="20px" viewBox="0 0 256 256">
              <path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm108.34,72.28A15.92,15.92,0,0,0,144,139.17v55.49L112,216V139.17a15.92,15.92,0,0,0-4.32-10.94L40,56H216Z" />
            </svg>
          </button>

          <button
            type="button"
            className="bg-[#ea2a33] text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:ring-opacity-50 transition ease-in-out duration-150 flex items-center gap-2"
            onClick={() => setChooseAppOpen(true)}
          >
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
            </svg>
            <span>Add Endpoint</span>
          </button>
        </div>
      </header>

      <div className="p-8">
        {!loading && filtered.length === 0 ? (
          <div className="px-0 py-16">
            <div className="flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor" aria-hidden="true">
                    <path d="M20 5H4a2 2 0 0 0-2 2v7a4 4 0 0 0 4 4h7a5 5 0 0 0 5-5V7a2 2 0 0 0-2-2Zm0 9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7h17v7ZM7 9h7v2H7V9Zm0 4h5v2H7v-2Z" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  {hasSearch || hasFilters ? <>No results found</> : 'No endpoints yet'}
                </h3>

                <p className="mt-2 text-sm text-[#4d4d4d]">
                  {hasSearch || hasFilters
                    ? 'Try adjusting your search or reset filters to see more endpoints.'
                    : 'Create your first endpoint to get started.'}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {hasSearch && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Clear search
                    </button>
                  )}
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={() => { setFilterApp('all'); setFilterMethod('all'); setFilterDb('all') }}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Reset filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setChooseAppOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#ea2a33] px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    <svg fill="currentColor" width="16" height="16" viewBox="0 0 256 256" aria-hidden="true">
                      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
                    </svg>
                    Add Endpoint
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Name</th>
                    <th className="px-6 py-4 text-left font-medium">Method</th>
                    <th className="px-6 py-4 text-left font-medium">App</th>
                    <th className="px-6 py-4 text-left font-medium">Linked Database</th>
                    <th className="px-6 py-4 text-left font-medium">Created</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((ep, idx) => {
                    const appName = apps.find(a => a.id === ep.application_id)?.name || ep.application_id
                    const dbName = dbNameById.get(ep.database_id) || ep.database_id
                    const isLastTwo = idx >= pageRows.length - 2

                    return (
                      <tr
                        key={ep.id}
                        className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                        onClick={() => navigate(`/applications/${ep.application_id}/endpoints/${ep.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--text-primary)]">{ep.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <MethodBadge method={ep.method} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/applications/${ep.application_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#ec1313] hover:underline"
                          >
                            {appName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">{dbName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {new Date(ep.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative" ref={openMenuId === ep.id ? menuRef : null}>
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={openMenuId === ep.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                setOpenMenuId(prev => {
                                  const willOpen = prev !== ep.id
                                  setMenuCoords(willOpen ? { top: rect.bottom, right: window.innerWidth - rect.right } : null)
                                  return willOpen ? ep.id : null
                                })
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-slate-600">
                                <circle cx="5" cy="12" r="2"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <circle cx="19" cy="12" r="2"></circle>
                              </svg>
                            </button>

                            {openMenuId === ep.id && menuCoords && createPortal(
                              <div
                                ref={menuRef}
                                role="menu"
                                aria-label="Endpoint actions"
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
                                  onClick={() => navigate(`/applications/${ep.application_id}/endpoints/${ep.id}`)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" /></svg>
                                  View
                                </button>

                                <button
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId(null)
                                    setMenuCoords(null)
                                    setConfirmEp(ep)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                                    <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
                                  </svg>
                                  Delete
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white rounded-b-xl mt-4">
                <div className="text-sm text=[var(--text-secondary)]">
                  Showing <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.start}</span> to{' '}
                  <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.end}</span> of{' '}
                  <span className="font-semibold text-[var(--text-primary)]">{paginationInfo.total}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={offset === 0}
                    className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={offset + PAGE_SIZE >= filtered.length}
                    className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {chooseAppOpen && createPortal(
        <div className="fixed inset-0 z-[10000]" onClick={() => setChooseAppOpen(false)}>
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Select application</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <label className="text-sm text-[#4d4d4d]">Application</label>
                <select
                  value={createAppId}
                  onChange={(e) => setCreateAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="" disabled>Select an application…</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="px-6 py-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm"
                  onClick={() => setChooseAppOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-[#ea2a33] text-white px-4 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={!createAppId}
                  onClick={() => { setChooseAppOpen(false); setCreateModalOpen(true) }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {filterOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-start justify-end p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/20" />
          <div
            ref={filterCardRef}
            className="relative mt-16 mr-8 w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="text-gray-500" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                <path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm108.34,72.28A15.92,15.92,0,0,0,144,139.17v55.49L112,216V139.17a15.92,15.92,0,0,0-4.32-10.94L40,56H216Z" />
              </svg>
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Filter endpoints</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#4d4d4d] block mb-1">Application</label>
                <select
                  value={filterApp}
                  onChange={(e) => setFilterApp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">All</option>
                  {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-[#4d4d4d] block mb-1">Method</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">All</option>
                  {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-[#4d4d4d] block mb-1">Linked Database</label>
                <select
                  value={filterDb}
                  onChange={(e) => setFilterDb(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">All</option>
                  {dbOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setFilterApp('all'); setFilterMethod('all'); setFilterDb('all') }}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="bg-[#ea2a33] text-white px-4 py-1.5 rounded-md hover:bg-red-700 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmEp && createPortal(
        <div className="fixed inset-0 z-[10000]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !removing && setConfirmEp(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Delete endpoint</h3>
                <p className="mt-1 text-sm text-[#4d4d4d]">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-[#1a1a1a]">{confirmEp.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => setConfirmEp(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(confirmEp)}
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
                  {removing ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <EndpointFormModal
        isOpen={createModalOpen}
        mode="create"
        appId={createAppId}
        databaseId={''}
        onClose={() => setCreateModalOpen(false)}
        onSaved={async () => { setCreateModalOpen(false); await load() }}
      />
    </div>
  )
}