// dashboard/api.ts
import { makeGraphQLRequest } from "@/lib/utils";

export type LatencyPoint = { ts: string; p50: number; p95?: number | null; p99?: number | null }

export type DashboardResponse = {
  lastUpdatedISO?: string
  user?: { displayName?: string | null; avatarUrl?: string | null } | null

  summary?: {
    applications: { count: number }
    databases: { count: number }
    endpoints: { count: number }
    api_requests: { count: number; deltaPercent?: number | null; deltaWindow?: string | null; trend?: 'up' | 'down' | null }
  }

  performance?: {
    reliability?: {
      successRatePercent?: number | null
      errorRatePercent?: number | null
      errorBreakdown?: { x4xx?: number; x5xx?: number }
    } | null
    latency?: {
      average?: number | null
      p95?: number | null
      p99?: number | null
      unit?: string | null
      // NEW: data for the chart
      timeseries?: LatencyPoint[]
      window?: string | null         // e.g. "last_60m"
      bucketSizeSec?: number | null  // e.g. 60
    } | null
    topEndpoints?: Array<{ path: string; rpm: number; avgLatencyMs: number }>
    slowestEndpoints?: Array<{ path: string; avgLatencyMs: number; p95LatencyMs?: number }>
  } | null

  systemHealth?: { apiUptimePercent: number; averageLatencyMs: number; errorRatePercent: number } | null
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const query = `
    query Dashboard {
      dashboard {
        lastUpdatedISO
        user { displayName avatarUrl }

        summary {
          applications { count }
          databases { count }
          endpoints { count }
          api_requests { count deltaPercent deltaWindow trend }
        }

        performance {
          reliability {
            successRatePercent
            errorRatePercent
            errorBreakdown { x4xx x5xx }
          }
          latency {
            average
            p95
            p99
            unit
            window
            bucketSizeSec
            timeseries { ts p50 p95 p99 }
          }
          topEndpoints { path rpm avgLatencyMs }
          slowestEndpoints { path avgLatencyMs p95LatencyMs }
        }

        systemHealth { apiUptimePercent averageLatencyMs errorRatePercent }
      }
    }
  `
  const { data } = await makeGraphQLRequest(query)
  return data?.dashboard ?? {}
}

export type AuditNode = {
  id: string
  action: string
  ago?: string | null
  application_id?: string | null
  created_at?: string | null
  description?: string | null
  entity_id?: string | null
  entity_type?: string | null
  ip_address?: string | null
  metadata?: unknown
  ts?: string | null
  user_id?: string | null
  username?: string | null
}

export async function fetchAudits(limit: number, offset: number): Promise<{ nodes: AuditNode[]; totalCount: number }> {
  const query = `
    query Audits($limit: Int!, $offset: Int!) {
      audits(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id action ago application_id created_at description entity_id entity_type
          ip_address metadata ts user_id username
        }
      }
    }
  `
  const res = await makeGraphQLRequest(query, { limit, offset })
  const nodes = res?.data?.audits?.nodes ?? []
  const totalCount = res?.data?.audits?.totalCount ?? 0
  return { nodes, totalCount }
}

export async function fetchAuditsTotalCount(): Promise<{ data: { audits: { totalCount: number } } }> {
  const query = `
    query AuditsTotal {
      audits { totalCount }
    }
  `
  return makeGraphQLRequest(query)
}