import { getAuthToken } from '@/lib/http';
import { makeGraphQLRequest } from '@/lib/utils';
import { ApplicationDetailResponse, ApplicationsResponse, DatabaseCountResponse, EndpointCountResponse } from './types'
import { config } from '@/app/config'

const GRAPHQL_ENDPOINT = config.gqlBaseURL

export async function fetchApplicationsPage(pagination: { limit: number; offset: number }): Promise<ApplicationsResponse> {
  const query = `
    query ApplicationsPage($limit: Int!, $offset: Int!) {
      applications(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          api_key
          created_at
          updated_at
          user_id
        }
      }
      databases {
        nodes { id application_id }
      }
      endpoints {
        nodes { id application_id }
      }
    }
  `
  return makeGraphQLRequest(query, { limit: pagination.limit, offset: pagination.offset })
}

export async function fetchApplicationsTotalCount(): Promise<{ data: { applications: { totalCount: number } } }> {
  const query = `
    query ApplicationsTotal {
      applications {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query)
}

export async function createApplication(payload: { name: string; api_key: string }) {
  const token = await getAuthToken()
  const res = await fetch(`http://localhost:4000/application/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('qb_token')
      window.location.href = '/signin'
      throw new Error('Authentication failed')
    }
    const txt = await res.text().catch(() => '')
    throw new Error(txt || `Failed to create application (status ${res.status})`)
  }

  return res.json().catch(() => ({}))
}

export async function deleteApplication(appId: string): Promise<void> {
  const token = await getAuthToken()
  const res = await fetch(`http://localhost:4000/application/${appId}/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('qb_token')
      window.location.href = '/signin'
      throw new Error('Authentication failed')
    }
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to delete application (status ${res.status})`)
  }
}

export async function updateApplication(appId: string, payload: { name: string; api_key: string }): Promise<void> {
  const token = await getAuthToken()
  const res = await fetch(`http://localhost:4000/application/${appId}/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('qb_token')
      window.location.href = '/signin'
      throw new Error('Authentication failed')
    }
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to update application (status ${res.status})`)
  }
}

export async function searchApplications(name: string) {
  const token = await getAuthToken()
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query Applications($name: String!) {
          applications(name: $name) {
            nodes {
              api_key
              created_at
              id
              name
              updated_at
              user_id
            }
          }
        }
      `,
      variables: { name },
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to search applications (${res.status})`)
  }

  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join(', '))
  }

  return json.data.applications.nodes
}


export async function fetchApplicationDetail(appId: string): Promise<ApplicationDetailResponse> {
  const query = `
    query Applications($id: String!) {
      applications(id: $id) {
        totalCount
        nodes {
          api_key
          created_at
          id
          name
          updated_at
          user_id
        }
      }
    }
  `

  return makeGraphQLRequest(query, { id: appId })
}

export async function fetchDatabaseCount(appId: string): Promise<DatabaseCountResponse> {
  const query = `
    query Databases($appId: String!) {
      databases(application_id: $appId) {
        totalCount
      }
    }
  `

  return makeGraphQLRequest(query, { appId })
}

export async function fetchEndpointCount(appId: string): Promise<EndpointCountResponse> {
  const query = `
    query Endpoints($appId: String!) {
      endpoints(application_id: $appId) {
        totalCount
      }
    }
  `

  return makeGraphQLRequest(query, { appId })
}

export async function fetchAuditsPage(
  appId: string,
  opts: { limit: number; offset: number }
) {
  const query = `
    query Audits($appId: String!, $limit: Int!, $offset: Int!) {
      audits(application_id: $appId, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          action
          application_id
          created_at
          description
          entity_id
          entity_type
          id
          ip_address
          metadata
          username
        }
      }
    }
  `
  return makeGraphQLRequest(query, { appId, ...opts })
}

export async function fetchAuditsTotalCount(
  appId: string
): Promise<{ data: { audits: { totalCount: number } } }> {
  const query = `
    query AuditsTotal($appId: String!) {
      audits(application_id: $appId) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { appId })
}

export async function fetchApplicationDetailData(appId: string) {
  const [applicationResponse, databaseResponse, endpointResponse] = await Promise.all([
    fetchApplicationDetail(appId),
    fetchDatabaseCount(appId),
    fetchEndpointCount(appId),
  ])

  return {
    application: applicationResponse.data.applications.nodes[0],
    databaseCount: databaseResponse.data.databases.totalCount,
    endpointCount: endpointResponse.data.endpoints.totalCount,
  }
}


export type AppLog = {
  created_at: string
  level: string
  message: string
  source: string
  timestamp?: string
  updated_at?: string
  application?: string
  user?: string
}

export async function fetchApplicationLogs(appId: string): Promise<{ nodes: AppLog[]; totalCount: number }> {
  const query = `
    query Stream_logs($application: String!) {
      stream_logs(application: $application) {
        nodes {
          created_at
          level
          message
          timestamp
          updated_at
        }
        totalCount
      }
    }
  `
  const res = await makeGraphQLRequest(query, { application: appId })
  const payload = res?.data?.stream_logs ?? { nodes: [], totalCount: 0 }
  return {
    nodes: payload.nodes ?? [],
    totalCount: payload.totalCount ?? (payload.nodes?.length ?? 0),
  }
}