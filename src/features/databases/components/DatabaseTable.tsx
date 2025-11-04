import type { Database, Endpoint } from '../types'
import { formatDate, engineLabel } from '../utils'

type Status = 'checking' | 'up' | 'down' | 'error'

function StatusBadge({ status }: { status: Status }) {
  if (status === 'checking') {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }
  if (status === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
        </svg>
        Connected
      </span>
    )
  }
  if (status === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95 1.414-1.414z" />
        </svg>
        Unreachable
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
      Error
    </span>
  )
}

export function DatabaseTable({
  databases,
  statusMap,
  getEndpointCount,
  onRowClick,
}: {
  databases: Database[]
  statusMap: Record<string, Status>
  getEndpointCount: (databaseId: string) => number
  onRowClick?: (db: Database) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-6 py-4 text-left font-medium">Name</th>
            <th className="px-6 py-4 text-left font-medium">Engine</th>
            <th className="px-6 py-4 text-left font-medium">Status</th>
            <th className="px-6 py-4 text-left font-medium">Endpoints</th>
            <th className="px-6 py-4 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {databases.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-[--text-secondary]">
                No databases yet
              </td>
            </tr>
          ) : (
            databases.map((database) => {
              const rowStatus: Status = statusMap[database.id] ?? 'checking'
              return (
                <tr
                  key={database.id}
                  className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onRowClick?.(database)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick?.(database)
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--text-primary)]">
                    {database.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                    {engineLabel(database.db_engine)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={rowStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                    {getEndpointCount(database.id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                    {formatDate(database.created_at)}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}