import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchDatabasesPage,
  fetchDatabasesTotalCount,
  fetchEndpointsForApp,
  testDatabaseConnectivity,
} from '../api'
import type { Database, Endpoint } from '../types'
import { DatabaseTable } from '../components/DatabaseTable'

const PAGE_SIZE = 10

export function DatabasesTable({ appId }: { appId: string }) {
  const navigate = useNavigate()
  const [databases, setDatabases] = useState<Database[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, 'checking' | 'up' | 'down' | 'error'>>({})

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

      const rows = pagedRes.data.databases.nodes ?? []
      setDatabases(rows)
      setTotalCount(totalRes.data.databases.totalCount ?? 0)
      setEndpoints(endpointsRes.data.endpoints.nodes ?? [])

      // initialize row status as 'checking'
      const next: Record<string, 'checking' | 'up' | 'down' | 'error'> = {}
      rows.forEach((d) => {
        next[d.id] = 'checking'
      })
      setStatusMap(next)

      // async connectivity checks
      await Promise.all(
        rows.map(async (d) => {
          try {
            const ok = await testDatabaseConnectivity(d.id)
            setStatusMap((prev) => ({ ...prev, [d.id]: ok ? 'up' : 'down' }))
          } catch {
            setStatusMap((prev) => ({ ...prev, [d.id]: 'error' }))
          }
        })
      )
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load databases')
    } finally {
      setLoading(false)
    }
  }

  const getEndpointCount = (databaseId: string) =>
    endpoints.filter((ep) => ep.database_id === databaseId).length

  if (loading && databases.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-0 min-h-[4rem] flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (loadError) {
    return <div className="text-red-500 mt-4">{loadError}</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-0">
      <DatabaseTable
        databases={databases}
        statusMap={statusMap}
        getEndpointCount={getEndpointCount}
        onRowClick={(db) => navigate(`/applications/${appId}/databases/${db.id}`)}
      />
    </div>
  )
}