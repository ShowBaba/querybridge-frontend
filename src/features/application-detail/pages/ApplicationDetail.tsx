import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchApplicationDetailData } from '../api'
import type { ApplicationDetail as ApplicationDetailType, Audit } from '../types'
import { maskApiKey, formatDate, formatDateTime, copyToClipboard } from '../utils'

export function ApplicationDetail() {
  const { appId } = useParams<{ appId: string }>()
  const [application, setApplication] = useState<ApplicationDetailType | null>(null)
  const [databaseCount, setDatabaseCount] = useState<number>(0)
  const [endpointCount, setEndpointCount] = useState<number>(0)
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchApplicationDetailData(appId)
        setApplication(data.application)
        setDatabaseCount(data.databaseCount)
        setEndpointCount(data.endpointCount)
        setAudits(data.audits)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application details')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [appId])

  const handleCopyApiKey = async (apiKey: string) => {
    const success = await copyToClipboard(apiKey)
    if (success) {
      setCopiedId('api-key')
      setTimeout(() => setCopiedId(null), 1500)
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
            <h1 className="text-3xl font-bold text-[#1a1a1a]">Application Details</h1>
            <p className="text-base text-[#4d4d4d]">View and manage your application settings and resources.</p>
          </div>
        </div>
        <div className="border-b border-b-[#fef0f0]">
          <nav className="-mb-px flex gap-8">
            <a className="whitespace-nowrap border-b-2 border-[#ea2a33] px-1 pb-4 text-sm font-semibold text-[#ea2a33]" href="#">
              Overview
            </a>
            <Link
              to={`/apps/${appId}/databases`}
              className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]"
            >
              Databases
            </Link>
            <a className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]" href="#">
              Endpoints
            </a>
            <a className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]" href="#">
              Logs
            </a>
            <a className="whitespace-nowrap border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]" href="#">
              Settings
            </a>
          </nav>
        </div>
        <div className="flex flex-col gap-8">
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
                <div className="md:col-span-2">
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
              {audits.length === 0 ? (
                <div className="text-center py-8 text-[#4d4d4d]">
                  <p>No recent activity</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-[#fef0f0]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]" scope="col">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]" scope="col">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]" scope="col">
                        User
                      </th>
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
                          {audit.user_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
