import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchApplicationDetailData, fetchAuditsPage, fetchAuditsTotalCount } from '../api'
import { updateApplication } from '@/features/applications/api'
import type { ApplicationDetail as ApplicationDetailType, Audit } from '../types'
import { maskApiKey, formatDate, formatDateTime, copyToClipboard } from '../utils'
import { createPortal } from 'react-dom'
import { deleteApplication } from '@/features/applications/api'
import { getPaginationInfo } from '@/lib/utils'
import { ActionsButton } from '../components/ActionsButton'
import { EndpointFormModal } from '@/features/endpoints/components/EndpointFormModal'
import { DatabaseFormModal } from '@/features/databases/components/DatabaseFormModal'
import { ApplicationLogs } from '../components/ApplicationLogs'
import { DatabasesTable } from '@/features/databases/pages/DatabasesTable'
import { EndpointsTable } from '@/features/endpoints/pages/EndpointsTable'


const AUDITS_PAGE_SIZE = 10

export function ApplicationDetail() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()

  const [application, setApplication] = useState<ApplicationDetailType | null>(null)
  const [databaseCount, setDatabaseCount] = useState<number>(0)
  const [endpointCount, setEndpointCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null)
  const [confirmApp, setConfirmApp] = useState<ApplicationDetailType | null>(null)
  const [removing, setRemoving] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editKey, setEditKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const actionsBtnRef = useRef<HTMLButtonElement | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [auditsTotalCount, setAuditsTotalCount] = useState(0)
  const [auditsOffset, setAuditsOffset] = useState(0)
  const [auditsLoading, setAuditsLoading] = useState(true)
  const [showCreateDb, setShowCreateDb] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  
  const tabKeys = ['overview', 'databases', 'endpoints', 'logs'] as const
  type Tab = typeof tabKeys[number]
  const activeTab: Tab = (searchParams.get('tab') as Tab) ?? 'overview'

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchApplicationDetailData(appId!)
      setApplication(data.application)
      setDatabaseCount(data.databaseCount)
      setEndpointCount(data.endpointCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application details')
    } finally {
      setLoading(false)
    }
  }

  // right after activeTab is derived
  useEffect(() => {
    // ensure any floating menus are closed when changing sections
    setOpenMenu(false)
    setMenuCoords(null)
  }, [activeTab])

  // useEffect(() => {
  //   if (urlTab !== activeTab) setActiveTab(urlTab)
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [urlTab])


  useEffect(() => {
    if (!appId) return
    loadData()
  }, [appId])

  useEffect(() => {
    if (!appId) return
    setAuditsOffset(0)
  }, [appId])

  useEffect(() => {
    if (auditsOffset >= auditsTotalCount && auditsTotalCount > 0) {
      setAuditsOffset(Math.max(0, Math.floor((auditsTotalCount - 1) / AUDITS_PAGE_SIZE) * AUDITS_PAGE_SIZE))
    }
  }, [auditsTotalCount])

  useEffect(() => {
    if (!appId) return
    const loadAudits = async () => {
      try {
        setAuditsLoading(true)
        const [pageRes, totalRes] = await Promise.all([
          fetchAuditsPage(appId, { limit: AUDITS_PAGE_SIZE, offset: auditsOffset }),
          fetchAuditsTotalCount(appId),
        ])
        setAudits(pageRes.data.audits.nodes ?? [])
        setAuditsTotalCount(totalRes.data.audits.totalCount ?? 0)
      } finally {
        setAuditsLoading(false)
      }
    }
    loadAudits()
  }, [appId, auditsOffset])

  const auditsPageInfo = getPaginationInfo(
    auditsOffset,
    AUDITS_PAGE_SIZE,
    auditsTotalCount,
    audits.length
  )

  const handleAuditsPrev = () => {
    if (auditsOffset > 0) setAuditsOffset(Math.max(0, auditsOffset - AUDITS_PAGE_SIZE))
  }

  const handleAuditsNext = () => {
    if (auditsOffset + AUDITS_PAGE_SIZE < auditsTotalCount) {
      setAuditsOffset(auditsOffset + AUDITS_PAGE_SIZE)
    }
  }

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      const t = e.target as Node
      if (
        openMenu &&
        menuRef.current &&
        !menuRef.current.contains(t) &&
        actionsBtnRef.current &&
        !actionsBtnRef.current.contains(t)
      ) {
        setOpenMenu(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenu(false)
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [openMenu])


  const handleCopyApiKey = async (apiKey: string) => {
    const success = await copyToClipboard(apiKey)
    if (success) {
      setCopiedId('api-key')
      setTimeout(() => setCopiedId(null), 1500)
    }
  }

  const onCreateDb = () => {
    setOpenMenu(false); setMenuCoords(null)
    if (!appId) return
    // send them to databases tab; optionally use a query flag your DB page can read
    navigate(`/applications/${appId}/databases?create=1`)
  }

  const [openCreateEndpoint, setOpenCreateEndpoint] = useState(false)

  const onCreateEndpoint = () => setOpenCreateEndpoint(true)

  const onEditApp = () => {
    setOpenMenu(false); setMenuCoords(null)
    if (!application) return
    setEditName(application.name ?? '')
    setEditKey(application.api_key ?? '')
    setEditError(null)
    setShowEdit(true)
  }

  const onDeleteApp = () => {
    setOpenMenu(false); setMenuCoords(null)
    if (application) setConfirmApp(application)
  }

  const autoGenerateKey = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    setEditKey(`sk-${rand.slice(0, 24)}-${rand.slice(-8)}`)
  }

  const submitEdit = async () => {
    if (!application || !appId) return
    if (!editName.trim() || !editKey.trim()) {
      setEditError('Please provide both Application Name and App Key.')
      return
    }
    try {
      setSaving(true)
      setEditError(null)
      await updateApplication(application.id, { name: editName.trim(), api_key: editKey.trim() })
      setShowEdit(false)
      await loadData() // refresh details
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="border-b border-b-[#fef0f0]">
            <div className="-mb-px flex gap-8">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-[#fef0f0]">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="bg-white rounded-lg border border-[#fef0f0] p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
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
              <h3 className="text-sm font-medium text-red-800">Error loading application details</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">Application not found</h3>
          <p className="text-[#4d4d4d]">The requested application could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Application Details</h1>
            <p className="text-base text-[#4d4d4d]">View and manage your application settings and resources.</p>
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
              {
                label: 'Edit application',
                onClick: onEditApp,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M229.66,77.66,178.34,26.34a8,8,0,0,0-11.31,0L57.37,136a8,8,0,0,0-2.11,3.73L48.06,181a8,8,0,0,0,9.21,9.21l41.25-7.2a8,8,0,0,0,3.73-2.11L229.66,88.97A8,8,0,0,0,229.66,77.66Z" />
                  </svg>
                ),
              },
              {
                label: 'Delete application',
                onClick: onDeleteApp,
                tone: 'danger',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
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
            onSaved={() => {
              setOpenCreateEndpoint(false)
              loadData()
            }}
          />
          <EndpointFormModal
            isOpen={openCreateEndpoint}
            mode="create"
            appId={appId!}

            onClose={() => setOpenCreateEndpoint(false)}
            onSaved={() => {
              setOpenCreateEndpoint(false)
              loadData()
            }} databaseId={''} />
        </div>
        <div className="border-b border-b-[#fef0f0] mb-2">
          <nav className="-mb-px flex gap-8">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'overview' }, { replace: true })}
              className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm ${activeTab === 'overview'
                  ? 'border-[#ea2a33] font-semibold text-[#ea2a33]'
                  : 'border-transparent font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                }`}
            >
              Overview
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'databases' }, { replace: true })}
              className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm ${activeTab === 'databases'
                  ? 'border-[#ea2a33] font-semibold text-[#ea2a33]'
                  : 'border-transparent font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                }`}
            >
              Databases
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'endpoints' }, { replace: true })}
              className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm ${activeTab === 'endpoints'
                  ? 'border-[#ea2a33] font-semibold text-[#ea2a33]'
                  : 'border-transparent font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                }`}
              aria-selected={activeTab === 'endpoints'}
            >
              Endpoints
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'logs' }, { replace: true })}
              className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm ${activeTab === 'logs'
                  ? 'border-[#ea2a33] font-semibold text-[#ea2a33]'
                  : 'border-transparent font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                }`}
              aria-selected={activeTab === 'logs'}
            >
              Logs
            </button>
            <button
              type="button"
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
              onClick={() => {/* open settings modal or navigate */ }}
            >
              Settings
            </button>
          </nav>
        </div>


        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-6 mt-0">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#1a1a1a]">Key Statistics</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-[#fef0f0]">
                  <p className="text-base font-medium text-[#4d4d4d]">Total Databases</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{databaseCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 border border-[#fef0f0]">
                  <p className="text-base font-medium text-[#4d4d4d]">Total Endpoints</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{endpointCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 border border-[#fef0f0]">
                  <p className="text-base font-medium text-[#4d4d4d]">Recent Activity</p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">{audits.length}</p>
                </div>

              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#1a1a1a]">Application Information</h2>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-[#fef0f0]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-[#4d4d4d]">Name</label>
                    <p className="text-sm text-[#1a1a1a] mt-1">{application.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#4d4d4d]">Application ID</label>
                    <p className="text-sm text-[#1a1a1a] mt-1 font-mono">{application.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#4d4d4d]">Created</label>
                    <p className="text-sm text-[#1a1a1a] mt-1">{formatDate(application.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#4d4d4d]">Last Updated</label>
                    <p className="text-sm text-[#1a1a1a] mt-1">
                      {application.updated_at ? formatDate(application.updated_at) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#4d4d4d]">API Key</label>
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mt-1">
                      <span className="text-sm text-[#4d4d4d] font-mono">{maskApiKey(application.api_key)}</span>
                      <button
                        type="button"
                        className="p-1.5 rounded-md hover:bg-gray-200 relative"
                        aria-label={copiedId === 'api-key' ? 'Copied' : 'Copy API key'}
                        title={copiedId === 'api-key' ? 'Copied!' : 'Copy'}
                        onClick={() => handleCopyApiKey(application.api_key)}
                      >
                        {copiedId === 'api-key' ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-green-600">
                            <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                          </svg>
                        ) : (
                          <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18">
                            <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                          </svg>
                        )}
                        {copiedId === 'api-key' && (
                          <span className="absolute -top-7 right-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                            Copied
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#1a1a1a]">Recent Activity</h2>

              <div className="overflow-x-auto rounded-lg border border-[#fef0f0] bg-white">
                {/* Loading skeleton */}
                {auditsLoading && (
                  <table className="min-w-full divide-y divide-[#fef0f0]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#fef0f0] bg-white">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4">
                            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {!auditsLoading && audits.length === 0 ? (
                  <div className="text-center py-8 text-[#4d4d4d]">
                    <p>No recent activity</p>
                  </div>
                ) : !auditsLoading ? (
                  <table className="min-w-full divide-y divide-[#fef0f0]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#fef0f0] bg-white">
                      {audits.map((audit) => (
                        <tr key={audit.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4d4d4d]">
                            {formatDateTime(audit.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4d4d4d]">
                            {audit.description}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-[#4d4d4d]">
                            {audit.username}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>

              {auditsTotalCount > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border border-t-0 border-[#fef0f0] bg-white rounded-b-lg">
                  <div className="text-sm text-[var(--text-secondary)]">
                    Showing <span className="font-semibold text-[var(--text-primary)]">{auditsPageInfo.start}</span> to{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{auditsPageInfo.end}</span> of{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{auditsPageInfo.total}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAuditsPrev}
                      disabled={!auditsPageInfo.hasPrevious || auditsLoading}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleAuditsNext}
                      disabled={!auditsPageInfo.hasNext || auditsLoading}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'databases' ? (
          <div className="mt-0">
            <DatabasesTable appId={appId!} />
          </div>
        ) : activeTab === 'endpoints' ? (
          <div className="mt-0">
            <EndpointsTable appId={appId!} />
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-0">
            <ApplicationLogs appId={appId!} />
          </div>
        )}
      </div>


      {openMenu && menuCoords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[9999] w-56 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
          style={{ top: menuCoords.top + 8, right: menuCoords.right }}
          onClick={(ev) => ev.stopPropagation()}
          onMouseDown={(ev) => ev.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onCreateDb() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" /></svg>
            Add database
          </button>

          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onCreateEndpoint() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M40,64H216v24H40ZM40,120H216v24H40Zm0,56H216v24H40Z" /></svg>
            Create endpoint
          </button>

          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onEditApp() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66,178.34,26.34a8,8,0,0,0-11.31,0L57.37,136a8,8,0,0,0-2.11,3.73L48.06,181a8,8,0,0,0,9.21,9.21l41.25-7.2a8,8,0,0,0,3.73-2.11L229.66,88.97A8,8,0,0,0,229.66,77.66Z" /></svg>
            Edit application
          </button>

          <button
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); onDeleteApp() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" /></svg>
            Delete application
          </button>
        </div>,
        document.body
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
                      setConfirmApp(null)
                      navigate('/applications')
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

      {showEdit && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
          onClick={() => { if (!saving) setShowEdit(false) }}
        >
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border-dark">
              <h2 className="text-xl font-bold text-[#111827] dark:text-foreground-dark">Edit Application</h2>
              <button
                onClick={() => !saving && setShowEdit(false)}
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
                    placeholder="e.g., a1b2c3..."
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg placeholder:text-[#9ca3af] dark:placeholder:text-placeholder-dark text-[#111827] dark:text-foreground-dark focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] transition-colors pr-28"
                  />
                  <a
                    href="#"
                    onClick={autoGenerateKey}
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
                disabled={saving}
                className="w-full bg-[#ec1313] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#ec1313]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-card-dark focus:ring-[#ec1313] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}
    </div>


  )
}
