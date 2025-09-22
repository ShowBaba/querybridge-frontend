import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApplications } from '../api'
import { Application, ApplicationsResponse } from '../types'

export function ApplicationsList() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({})
  const [epCounts, setEpCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res: ApplicationsResponse = await fetchApplications()

        const apps = res.data.applications?.nodes ?? []
        const dbs = res.data.databases?.nodes ?? []
        const eps = res.data.endpoints?.nodes ?? []

        // Build counts: ApplicationID -> count
        const dbMap: Record<string, number> = {}
        for (const d of dbs) dbMap[d.application_id] = (dbMap[d.application_id] ?? 0) + 1

        const epMap: Record<string, number> = {}
        for (const e of eps) epMap[e.application_id] = (epMap[e.application_id] ?? 0) + 1

        setApplications(apps)
        setDbCounts(dbMap)
        setEpCounts(epMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const maskApiKey = (apiKey: string) =>
    apiKey && apiKey.length > 8 ? `sk-${'•'.repeat(apiKey.length - 8)}-${apiKey.slice(-4)}` : apiKey

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

  return (
    <>
      {/* Header unchanged */}
      <header className="flex items-center justify-between border-b border-gray-200 px-10 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Applications</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg aria-hidden="true" className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                />
              </svg>
            </div>
            <input
              className="block w-full px-4 py-2 border border-[#fef0f0] rounded-lg bg-gray-50 text-[#1a1a1a] placeholder-[#4d4d4d] focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:border-[#ea2a33] transition ease-in-out duration-150 pl-10 w-64"
              placeholder="Search"
              type="text"
            />
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Help">
            <svg className="text-[#4d4d4d]" fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
            </svg>
          </button>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCyaalxikNcFsB5uGrtbtMnMm0ppWORShMKEO8ozMaHZ8ZPOTyMFR3WaksRRP5XEnEYoftFFh5huXhdHTgOffUAFncyj85iYS9BXZcoet_JmrtTUIMqTzkXWTWUayUUCf88NnsRkoeVjHGuV-i-r3cwu2Q1IXHPyRzZfL9aOTnu_DmuLkcEEa9vJRKh0N89eQgeU6nWHjJLJUPaScbZ9mnkMnCz1MC9QwhErKu4SGC_uRqasQ1zdvOiJKzu_l9IGArUUQihJQ29PW2y")',
            }}
          />
        </div>
      </header>

      {/* Body */}
      <div className="p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
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
                <h3 className="text-sm font-medium text-red-800">Error loading applications</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a1a]">Your Applications</h2>
            <p className="text-[#4d4d4d] mt-1">Manage your applications and their associated databases and endpoints.</p>
          </div>
          <button className="bg-[#ea2a33] text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:ring-opacity-50 transition ease-in-out duration-150 flex items-center gap-2">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
            <span>New Application</span>
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[#4d4d4d]" aria-label="Search">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
          </button>
          <button className="p-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-[#4d4d4d]" aria-label="Filter">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"><path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm108.34,72.28A15.92,15.92,0,0,0,144,139.17v55.49L112,216V139.17a15.92,15.92,0,0,0-4.32-10.94L40,56H216Z"></path></svg>
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-40" />
          ))}

          {!loading && applications.map((app) => {
            const isCopied = copiedId === app.id
            const dbCount = dbCounts[app.id] ?? 0
            const epCount = epCounts[app.id] ?? 0

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleApplicationClick(app.id)}
              >
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{app.name}</h3>

                  <div className="flex items-center text-[#4d4d4d] text-sm space-x-4 mb-4">
                    <span><strong className="text-[#1a1a1a]">{dbCount}</strong> Databases</span>
                    <span><strong className="text-[#1a1a1a]">{epCount}</strong> Endpoints</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="text-sm text-[#4d4d4d] font-mono">{maskApiKey(app.api_key)}</span>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-gray-200 relative"
                      aria-label={isCopied ? 'Copied' : 'Copy API key'}
                      title={isCopied ? 'Copied!' : 'Copy'}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(app.id, app.api_key)
                      }}
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
              </div>
            )
          })}

          {!loading && applications.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM68,96A12,12,0,1,1,80,84,12,12,0,0,1,68,96Z"></path></svg>
              </div>
              <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">No applications yet</h3>
              <p className="text-[#4d4d4d] mb-4">Get started by creating your first application</p>
              <button className="bg-[#ea2a33] text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-[#ea2a33] focus:ring-opacity-50 transition ease-in-out duration-150 flex items-center gap-2 mx-auto">
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
                <span>New Application</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}