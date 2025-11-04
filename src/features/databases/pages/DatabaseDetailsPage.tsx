import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchDatabaseById,
  fetchDatabaseTablesPage,
  fetchEndpointsForApp,
  deleteDatabase,
  testDatabaseConnectivity,
  fetchDatabaseSchemasPage,
  fetchTablesTotalCount,
  fetchTablesTotalColumnCount,
  fetchEndpointsForTable,
  fetchTableColumnsPage,
  fetchColumnsTotalCount,
} from '@/features/databases/api'
import { engineLabel, formatDate } from '@/features/databases/utils'
import { DatabaseFormModal } from '@/features/databases/components/DatabaseFormModal'
import type { Database, Endpoint } from '@/features/databases/types'
import { useToast } from '@/components/ui/Toast'
import { createPortal } from 'react-dom'
import { getPaginationInfo } from '@/lib/utils'
import { EndpointMethod, OrderDirection } from '@/features/endpoints/api'
import { EndpointFormModal } from '@/features/endpoints/components/EndpointFormModal'

const PAGE_SIZE = 10

const COLS_PAGE_SIZE = 10

type TableRow = { id: string; name: string; schema: string; column_count?: number | null }
export default function DatabaseDetailsPage() {
  const { appId, dbId } = useParams<{ appId: string; dbId: string }>()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [db, setDb] = useState<any | null>(null)
  const [tables, setTables] = useState<TableRow[]>([])
  const [tablesTotal, setTablesTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const [schemasTotal, setSchemasTotal] = useState(0)
  const [, setSchemaNameById] = useState<Record<string, string>>({})
  const openTableIdRef = useRef<string | null>(null)
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])

  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState<'checking' | 'up' | 'down' | 'error'>('checking')
  const [editOpen, setEditOpen] = useState(false)

  const [removing, setRemoving] = useState(false)
  const [, setOpenMenuId] = useState<string | null>(null)
  const [, setMenuCoords] = useState<{ top: number; right: number } | null>(null)
  const [confirmDb, setConfirmDb] = useState<Database | null>(null)

  const [copiedEpId, setCopiedEpId] = useState<string | null>(null)


  const [epModalOpen, setEpModalOpen] = useState(false)
  
  const [epInitial, setEpInitial] = useState<{
    name?: string
    method?: EndpointMethod
    table_id?: string | number
    database_id?: string | number
    columns?: string[]
    is_public?: boolean
    limit?: number
    order_by?: string
    order_direction?: OrderDirection
  }>()


  const [cols, setCols] = useState<{
    loading: boolean
    error: string | null
    total: number
    items: any[]
  }>({ loading: false, error: null, total: 0, items: [] })

  function openTableDrawer(t: { id: string; name: string; schema: string }) {
    openTableIdRef.current = t.id
    setDrawer({ open: true, table: t })
    setColsOffset(0)

    setCols({ loading: true, error: null, total: 0, items: [] })
    setEps({ loading: true, error: null, items: [] })
    setCopiedEpId(null)
  }

  function closeDrawer() {
    openTableIdRef.current = null
    setDrawer({ open: false, table: null })
    setCols({ loading: false, error: null, total: 0, items: [] })
    setEps({ loading: false, error: null, items: [] })
  }

  const [drawer, setDrawer] = useState<{
    open: boolean
    table: { id: string; name: string; schema: string } | null
  }>({ open: false, table: null })

  const [colsOffset, setColsOffset] = useState(0)

  const [eps, setEps] = useState<{ loading: boolean; error: string | null; items: any[] }>({
    loading: false,
    error: null,
    items: [],
  })

  useEffect(() => {
    if (colsOffset >= cols.total && cols.total > 0) {
      setColsOffset(Math.max(0, Math.floor((cols.total - 1) / COLS_PAGE_SIZE) * COLS_PAGE_SIZE))
    }
  }, [cols.total])

  const handleColsPrevious = () => {
    if (colsOffset > 0) setColsOffset(Math.max(0, colsOffset - COLS_PAGE_SIZE))
  }
  const handleColsNext = () => {
    if (colsOffset + COLS_PAGE_SIZE < cols.total) setColsOffset(colsOffset + COLS_PAGE_SIZE)
  }

  async function loadDrawerData(tableId: string, offset = 0) {
    setCols((s) => ({ ...s, loading: true, error: null }))
    setEps((s) => ({ ...s, loading: true, error: null }))

    try {
      const [colsPageRes, colsTotalRes] = await Promise.all([
        fetchTableColumnsPage(tableId, { limit: COLS_PAGE_SIZE, offset }),
        fetchColumnsTotalCount(tableId),
      ])
      if (openTableIdRef.current !== tableId) return

      const items = colsPageRes?.data?.columns?.nodes ?? []
      const total = colsTotalRes?.data?.columns?.totalCount ?? 0

      setCols({ loading: false, error: null, total, items })
    } catch (e) {
      if (openTableIdRef.current !== tableId) return
      const msg = e instanceof Error ? e.message : 'Failed to load columns'
      setCols({ loading: false, error: msg, total: 0, items: [] })
    }

    try {
      const epsRes = await fetchEndpointsForTable(tableId)
      if (openTableIdRef.current !== tableId) return

      const nodes =
        epsRes?.data?.endpoints?.nodes ??
        epsRes?.data?.endpoints?.nodes ??
        epsRes?.data?.endpoints?.nodes ??
        []

      const normalized = (Array.isArray(nodes) ? nodes : []).map((e: any) => {
        const method = (e?.method ? String(e.method) : 'GET').toUpperCase()
        const url = e?.url ? String(e.url) : ''
        const name = (e?.name && String(e.name).trim()) || ''
        const id = e?.id

        return { name: name, method, url, id }
      })
      setCopiedEpId(null)
      setEps({ loading: false, error: null, items: normalized })
    } catch (e) {
      if (openTableIdRef.current !== tableId) return
      const msg = e instanceof Error ? e.message : 'Failed to load endpoints'
      setEps({ loading: false, error: msg, items: [] })
    }
  }

  useEffect(() => {
    const id = drawer.table?.id
    if (!drawer.open || !id) return
    void loadDrawerData(id, colsOffset)
  }, [drawer.open, drawer.table?.id, colsOffset])


  useEffect(() => {
    if (!dbId || !appId) return
    let cancelled = false

    async function load() {
      try {
        setLoading(true); setError(null)

        const [dbRes, tblRes, epsRes, schTotalRes, schMapRes, tablesTotal] = await Promise.all([
          fetchDatabaseById(dbId!),
          fetchDatabaseTablesPage(dbId!, { limit: PAGE_SIZE, offset }),
          fetchEndpointsForApp(appId!),
          fetchDatabaseSchemasPage(dbId!, { limit: 1, offset: 0 }),
          fetchDatabaseSchemasPage(dbId!, { limit: 1000, offset: 0 }),
          fetchTablesTotalCount(dbId!)
        ])
        if (cancelled) return

        setDb(dbRes.data.database)
        setEndpoints(epsRes.data.endpoints.nodes || [])
        setTablesTotal(tablesTotal.data.tables.totalCount)
        setSchemasTotal(schTotalRes.data.schemas.totalCount || 0)

        const map: Record<string, string> = {}
          ; (schMapRes.data.schemas.nodes || []).forEach((s: any) => { map[s.id] = s.name })
        setSchemaNameById(map)

        setConnected('checking')
        try {
          const ok = await testDatabaseConnectivity(dbId!)
          if (!cancelled) setConnected(ok ? 'up' : 'down')
        } catch {
          if (!cancelled) setConnected('error')
        }

        const rows = (tblRes.data.tables.nodes || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          schema: map[t.schema_id] ?? t.schema_id,
          column_count: undefined
        }))
        setTables(rows)

        await Promise.all(
          rows.map(async (r: { id: string }) => {
            try {
              const res = await fetchTablesTotalColumnCount(r.id)
              const count = res?.data?.columns?.totalCount ?? null
              setTables(prev =>
                prev.map(p => (p.id === r.id ? { ...p, column_count: count } : p))
              )
            } catch {
              setTables(prev =>
                prev.map(p => (p.id === r.id ? { ...p, column_count: null } : p))
              )
            }
          })
        )
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load database')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [dbId, appId, offset])

  const linkedEndpointCount = useMemo(
    () => endpoints.filter(e => e.database_id === dbId).length,
    [endpoints, dbId]
  )


  const testNow = async () => {
    if (!dbId) return
    try {
      setTesting(true)
      const ok = await testDatabaseConnectivity(dbId)
      setConnected(ok ? 'up' : 'down')
      ok ? success('Connection successful') : toastError('Database unreachable')
    } catch {
      setConnected('error')
      toastError('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const pagination = {
    start: tablesTotal === 0 ? 0 : offset + 1,
    end: Math.min(offset + PAGE_SIZE, tablesTotal),
    hasPrev: offset > 0,
    hasNext: offset + PAGE_SIZE < tablesTotal,
  }

  const handleRemove = async (database: Database) => {
    setRemoving(true)
    setOpenMenuId(null)
    setMenuCoords(null)
    try {
      await deleteDatabase(database.id)
      success(`${database.name} removed successfully`)
      setConfirmDb(null)
      navigate(`/applications/${appId}/databases`)
    } catch (err) {
      toastError('Failed to remove database')
    } finally {
      setRemoving(false)
    }
  }

  if (loading && !db) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !db) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-sm text-red-700">{error || 'Database not found'}</div>
        </div>
      </div>
    )
  }
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

  async function handleCopyEndpoint(id: string, url: string) {
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopiedEpId(id)
      setTimeout(() => setCopiedEpId(null), 1500)
    }
  }



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        
        <div>
          {/* <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  to={`/applications/${appId}/databases`}
                  className="text-[#6b7280] hover:text-[#111827] hover:underline"
                >
                  Databases
                </Link>
              </li>
              <li aria-hidden="true" className="text-[#9ca3af]">
                <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M96.97,215.03a8,8,0,0,1-5.66-13.66L148.69,144,91.31,86.63A8,8,0,0,1,102.63,75.3l64,64a8,8,0,0,1,0,11.32l-64,64A8,8,0,0,1,96.97,215.03Z" />
                </svg>
              </li>
              <li className="font-semibold text-[#111827] truncate max-w-[60vw]" title={db.name}>
                {db.name}
              </li>
            </ol>
          </nav> */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mr-3"
          >
            <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,128a8,8,0,0,1-8,8H69.66l34.17,34.17a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48a8,8,0,1,1,11.32,11.32L69.66,120H216A8,8,0,0,1,224,128Z" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Database Details</h1>
          <p className="text-sm text-[#4d4d4d] mt-1">
            View and manage your database connection details, tables, and linked endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={testNow}
            disabled={testing}
            className="px-4 py-2 text-sm font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5 disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded bg-[#ec1313] text-white hover:bg-[#ec1313]/90"
          >
            Update Database
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setConfirmDb(db as Database)
            }}
            disabled={removing}
            className="px-4 py-2 text-sm font-medium rounded text-[#ec1313] hover:bg-[#ec1313]/10"
          >
            Remove Database

          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-black/5 mb-6">
        <h2 className="text-lg font-bold text-[#111827]">Database Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mt-4 text-sm">
          <Info label="Name" value={db.name} />
          <Info label="Engine" value={engineLabel(db.db_engine)} />
          <Info label="Host & Port" value={`${db.host}:${db.port}`} />
          <Info label="Created" value={formatDate(db.created_at)} />
          <Info label="Schemas" value={String(schemasTotal)} />
          <Info label="Tables" value={String(tablesTotal)} />
          <Info label="Endpoints" value={String(linkedEndpointCount)} />
        </div>

        <div className="mt-4"><StatusBadge state={connected} /></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-black/5 overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#111827]">Tables</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-4 py-2 text-left font-medium text-[#6b7280] w-2/3">Table Name</th>
                <th className="px-4 py-2 text-left font-medium text-[#6b7280] w-1/3">Schema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {tables.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#6b7280]" colSpan={2}>No tables found</td>
                </tr>
              ) : (
                tables.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => openTableDrawer(t)}
                  >
                    <td className="px-4 py-3">
                      <div className="truncate" title={t.name}>{t.name}</div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">
                      <div className="truncate" title={t.schema}>{t.schema}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tablesTotal > 0 && (
          <div className="p-4 flex items-center justify-between border-t border-black/5 bg-white">
            <div className="text-sm text-[#6b7280]">
              Showing <span className="font-semibold text-[#111827]">{pagination.start}</span> to{' '}
              <span className="font-semibold text-[#111827]">{pagination.end}</span> of{' '}
              <span className="font-semibold text-[#111827]">{tablesTotal}</span> tables
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {drawer.open && createPortal(
        <div className="fixed inset-0 z-[10020] pointer-events-none">
          <div
            className="fixed inset-0 bg-black/30 z-40 pointer-events-auto"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          <aside
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 pointer-events-auto
                 bg-white dark:bg-background-dark rounded-l-lg shadow-lg
                 border-l border-black/5 dark:border-white/10 flex flex-col
                 translate-x-0 transition-transform duration-200 will-change-transform"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
              <div className="min-w-0">
                {drawer.table ? (
                  <>
                    <h2
                      className="text-lg font-bold text-black dark:text-black truncate"
                      title={drawer.table.name}
                    >
                      {drawer.table.name}
                    </h2>
                    <p className="text-sm text-black/60 dark:text-black/60 truncate">
                      Schema: {drawer.table.schema}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                )}
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                onClick={closeDrawer}
              >
                <span className="material-symbols-outlined text-xl text-black/60 dark:text-black/60">close</span>
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-8">
              <div>
                <h3 className="font-bold text-black dark:text-black">Columns</h3>
                <div className="mt-4 text-sm border-t border-black/10 dark:border-white/10 pt-4 space-y-4">
                  {cols.loading ? (
                    <div className="space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ) : cols.error ? (
                    <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2">{cols.error}</div>
                  ) : cols.items.length === 0 ? (
                    <div className="text-[#6b7280]">No columns</div>
                  ) : (
                    (() => {
                      const truthyString = (v?: string | null) =>
                        v && v !== '{ false}' && v !== 'false' && v !== '{}' && v.trim() !== '' ? v : ''

                      const fkLabel = (c: any) => {
                        const schema = truthyString(c.fk_ref_schema)
                        const table = truthyString(c.fk_ref_table)
                        const col = truthyString(c.fk_ref_column)
                        if (schema || table || col) {
                          const path = [schema, table, col].filter(Boolean).join('.')
                          return path ? `FK → ${path}` : ''
                        }
                        return ''
                      }

                      const defaultLabel = (c: any) => {
                        const d = truthyString(c.default_value)
                        return d ? `Default: ${d}` : ''
                      }

                      return cols.items.map((c: any) => {
                        const pk = c.is_primary_key === true
                        const notNull = c.is_nullable === false
                        const fk = fkLabel(c)
                        const def = defaultLabel(c)

                        const constraints =
                          [pk ? 'PRIMARY KEY' : null, notNull ? 'NOT NULL' : 'Nullable', fk || null]
                            .filter(Boolean)
                            .join(' · ') || '—'

                        const cleanedDefault = def ? def.replace(/^Default:\s*/, '') : '—'

                        return (
                          <div
                            key={c.id}
                            className="space-y-3 py-3 border-b border-gray-200 last:border-b-0"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-black/60 dark:text-black/60">Column Name</span>
                              <span className="col-span-2 font-medium text-black dark:text-black break-words">
                                {c.name}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-black/60 dark:text-black/60">Data Type</span>
                              <span className="col-span-2 font-medium text-black dark:text-black">
                                {c.data_type || '—'}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-black/60 dark:text-black/60">Constraints</span>
                              <span className="col-span-2 font-medium text-black dark:text-black">
                                {constraints}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-black/60 dark:text-black/60">Default Value</span>
                              <span className="col-span-2 font-medium text-black dark:text-black">
                                {cleanedDefault}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    })()
                  )}
                </div>

                {cols.total > 0 && (() => {
                  const remaining = Math.max(0, cols.total - colsOffset)
                  const countOnPage = Math.min(COLS_PAGE_SIZE, remaining)

                  const info = getPaginationInfo(
                    colsOffset,
                    COLS_PAGE_SIZE,
                    cols.total,
                    countOnPage
                  )

                  return (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-[#6b7280]">
                        Showing <span className="font-semibold text-[#111827]">{info.start}</span> to{' '}
                        <span className="font-semibold text-[#111827]">{info.end}</span> of{' '}
                        <span className="font-semibold text-[#111827]">{info.total}</span> columns
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleColsPrevious}
                          disabled={!info.hasPrevious}
                          className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                          aria-label="Previous page"
                        >
                          Previous
                        </button>
                        <button
                          onClick={handleColsNext}
                          disabled={!info.hasNext || cols.loading}
                          className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div>
                <h3 className="font-bold text-black dark:text-black">Linked Endpoints</h3>
                <ul className="mt-4 space-y-2 text-sm border-t border-black/10 dark:border-white/10 pt-4">
                  {eps.loading ? (
                    <>
                      <li className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                      <li className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </>
                  ) : eps.error ? (
                    <li className="text-red-600 bg-red-50 border border-red-200 rounded p-2">{eps.error}</li>
                  ) : eps.items.length === 0 ? (
                    <li className="text-[#6b7280]">No linked endpoints</li>
                  ) : (
                    eps.items.map((e: any) => {
                      const isCopied = copiedEpId === e.id
                      return (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-3 bg-black/5 dark:bg-white/10 px-3 py-2 rounded"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-black dark:text-black">
                              {e.name || 'Untitled Endpoint'}
                            </span>
                            <span className="text-xs text-black/60 dark:text-black/60">
                              {(e.method || 'GET').toUpperCase()}
                            </span>
                          </div>

                          {e.url && (
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation()
                                void handleCopyEndpoint(e.id, e.url)
                              }}
                              aria-label={isCopied ? 'Copied' : 'Copy endpoint URL'}
                              title={isCopied ? 'Copied!' : 'Copy URL'}
                              className="p-1.5 rounded-md hover:bg-gray-200 relative text-[#111827]"
                            >
                              {isCopied ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-green-600">
                                  <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                                </svg>
                              ) : (
                                <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18" className="opacity-80">
                                  <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                                </svg>
                              )}
                              {isCopied && (
                                <span className="absolute -top-7 right-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                                  Copied
                                </span>
                              )}
                            </button>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 text-sm font-medium rounded bg-[#ec1313] text-white hover:bg-[#ec1313]/90"
                onClick={() => {
                  if (!drawer.table) return
                  setEpInitial({
                    database_id: dbId!,                    
                    table_id: drawer.table.id,            
                    method: 'GET',                        
                    name: `Get ${drawer.table.name}`,     
                  })
                  setEpModalOpen(true)
                }}
              >
                Generate Endpoint
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}


      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title="Connection Settings"
          desc="View and modify the connection settings for this database."
          linkText="View Settings →"
          onLinkClick={() => setEditOpen(true)}
        />
                <Card title="Linked Applications" desc="Manage applications linked to this database." linkText="Manage Links →" />
        <Card title="Audit Logs" desc="View audit logs for this database." linkText="View Logs →" />
      </div>

      {editOpen && (
        <DatabaseFormModal
          isOpen={editOpen}
          mode="edit"
          dbId={db.id}
          initial={{
            name: db.name ?? '',
            host: db.host ?? '',
            port: db.port ?? 5432,
            database: db.database ?? '',
            username: db.username ?? '',
            password: '',
            db_engine: db.db_engine ?? 'postgres',
            ssl_mode: db.ssl_mode ?? 'disable',
          }}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            setEditOpen(false)
            try {
              const res = await fetchDatabaseById(dbId!)
              setDb(res.data.database)
              success('Database updated')
            } catch { /* ignore */ }
          }}
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

      {epModalOpen && (
        <EndpointFormModal
          isOpen={epModalOpen}
          mode="create"
          appId={appId!}
          databaseId={dbId}                
          initial={epInitial}             
          onClose={() => setEpModalOpen(false)}
          onSaved={async () => {
            setEpModalOpen(false)
            if (drawer.table?.id) {
              await loadDrawerData(drawer.table.id, colsOffset)
            }
          }}
        />
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-medium text-[#111827]">{value}</span>
    </div>
  )
}

function Card({
  title,
  desc,
  linkText,
  onLinkClick,
}: {
  title: string
  desc: string
  linkText: string
  onLinkClick?: () => void
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-black/5">
      <h3 className="text-base font-bold text-[#111827]">{title}</h3>
      <p className="text-sm text-[#6b7280] mt-1">{desc}</p>
      <button
        type="button"
        onClick={onLinkClick}
        className="text-sm font-medium text-[#ec1313] mt-4 inline-block hover:underline"
      >
        {linkText}
      </button>
    </div>
  )
}

function StatusBadge({ state }: { state: 'checking' | 'up' | 'down' | 'error' }) {
  if (state === 'checking') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </span>
    )
  }
  if (state === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" /></svg>
        Connected
      </span>
    )
  }
  if (state === 'down') {
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