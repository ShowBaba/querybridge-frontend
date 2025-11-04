import { useState } from 'react'
import { formatDate } from '../../applications/utils'
import type { Endpoint } from '../types'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { MethodBadge } from './EndpointMethodBadge'

interface EndpointTableProps {
  endpoints: Endpoint[]
  dbNameById: Map<string, string>
}


export function EndpointTable({ endpoints, dbNameById }: EndpointTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { appId } = useParams<{ appId: string }>()
  const { error: toastError, success } = useToast()

  const copyUrl = async (id: string, url?: string | null) => {
    if (!url) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1200)
      success?.('Copied endpoint URL')
    } catch {
      toastError?.('Failed to copy')
    }
  }

  return (
    <table className="min-w-full divide-y divide-[#fef0f0]">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Method</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Linked Database</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Created Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#4d4d4d]">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-[#fef0f0] bg-white">
        {endpoints.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
              No endpoints yet
            </td>
          </tr>
        ) : (
          endpoints.map((ep) => {
            const dbName = dbNameById?.get(ep.database_id) ?? '—'
            const method = (ep as any).method ?? '-'

            return (
              <tr
                key={ep.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/applications/${appId}/endpoints/${ep.id}`)}
              >
                <td className="px-6 py-4 text-sm text-[#1a1a1a]">{ep.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <MethodBadge method={method} />
                </td>                <td className="px-6 py-4 text-sm text-[#4d4d4d]">{dbName}</td>
                <td className="px-6 py-4 text-sm text-[#4d4d4d]">{formatDate(ep.created_at)}</td>
                <td className="px-6 py-4 text-sm">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      void copyUrl(ep.id, (ep as any).url)
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
                    title={copiedId === ep.id ? 'Copied!' : 'Copy URL'}
                    aria-label="Copy endpoint URL"
                  >
                    {copiedId === ep.id ? (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-green-600">
                          <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
                        </svg>
                        Copy URL
                      </>
                    )}
                  </button>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}