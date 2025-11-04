import { useState, useEffect, useMemo } from 'react'
import { fetchEndpoints, fetchEndpointsTotalCount } from '../api'
import type { Endpoint } from '../types'
import { EndpointTable } from '../components/EndpointTable'
import { getPaginationInfo } from '@/lib/utils'
import { fetchDatabasesPage } from '@/features/databases/api'
import type { Database } from '@/features/databases/types'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { ActionsButton } from '@/features/applications/components/ActionsButton'
import { EndpointFormModal } from '../components/EndpointFormModal'

const PAGE_SIZE = 10

export function EndpointsPage() {
  const { appId } = useParams<{ appId: string }>()
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [databases, setDatabases] = useState<Database[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const [openCreate, setOpenCreate] = useState(false)

  const onCreateEndpoint = () => setOpenCreate(true)

  useEffect(() => {
    if (!appId) return
    loadData()
  }, [appId, offset])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [epsRes, totalRes, dbsRes] = await Promise.all([
        fetchEndpoints(appId!, PAGE_SIZE, offset),
        fetchEndpointsTotalCount(appId!),
        fetchDatabasesPage(appId!, { limit: 1000, offset: 0 }),
      ])

      setEndpoints(epsRes.data.endpoints.nodes)
      setTotalCount(totalRes.data.endpoints.totalCount)
      setDatabases(dbsRes.data.databases.nodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoints')
    } finally {
      setLoading(false)
    }
  }

  const dbNameById = useMemo(() => {
    const m = new Map<string, string>()
    databases.forEach(d => m.set(d.id, d.name))
    return m
  }, [databases])

  const paginationInfo = getPaginationInfo(offset, PAGE_SIZE, totalCount)

  if (loading && endpoints.length === 0) {
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Name</th>
                    <th className="px-6 py-4 text-left font-medium">Method</th>
                    <th className="px-6 py-4 text-left font-medium">Linked Database</th>
                    <th className="px-6 py-4 text-left font-medium">Created Date</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w/full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading endpoints</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={loadData}
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
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Application Endpoints</h1>
            <p className="text-base text-[#4d4d4d]">Manage your application endpoints.</p>
          </div>

          <ActionsButton
            items={[
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

          <EndpointFormModal
            isOpen={openCreate}
            mode="create"
            appId={appId!}

            onClose={() => setOpenCreate(false)}
            onSaved={() => {
              setOpenCreate(false)
              loadData()
            }} databaseId={''} />
        </div>

        <div className="border-b border-b-[#fef0f0]">
          <nav className="-mb-px flex gap-8">
            <Link
              to={`/applications/${appId}`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]">
              Overview
            </Link>
            <Link
              to={`/applications/${appId}/databases`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]">
              Databases
            </Link>
            <Link
              to={`/applications/${appId}/endpoints`}
              className="whitespace-nowrap border-b-2 border-[#ea2a33] px-1 pb-4 text-sm font-semibold text-[#ea2a33]">
              Endpoints
            </Link>
            <Link to="#" className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]">
              Logs
            </Link>
            <Link to="#" className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]">
              Settings
            </Link>
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <EndpointTable
              endpoints={endpoints}
              dbNameById={dbNameById}
            />
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
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={!paginationInfo.hasPrevious}
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                  type="button"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
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
    </div>
  )
}