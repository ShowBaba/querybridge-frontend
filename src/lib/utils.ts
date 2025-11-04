import { type ClassValue, clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { config } from '@/app/config'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date, formatStr: string = 'PPP') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export function formatRelativeTime(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

/**
 * Calculate pagination info for display
 */
export function getPaginationInfo(
  offset: number,
  totalCount: number,
  currentPageCount: number
) {
  const start = totalCount === 0 ? 0 : offset + 1
  const end = Math.min(offset + currentPageCount, totalCount)

  return {
    start,
    end,
    total: totalCount,
    hasPrevious: offset > 0,
    hasNext: offset + currentPageCount < totalCount,
  }
}

const GRAPHQL_ENDPOINT = config.gqlBaseURL

async function getAuthToken(): Promise<string> {
  const token = localStorage.getItem('qb_token')
  if (!token) {
    localStorage.removeItem('qb_token')
    window.location.href = '/signin'
    throw new Error('No authentication token found')
  }
  return token
}

export async function makeGraphQLRequest(query: string, variables: Record<string, unknown> = {}) {
  const token = await getAuthToken()

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('qb_token')
      window.location.href = '/signin'
      throw new Error('Authentication failed')
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error')
  return data
}