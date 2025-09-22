import {
  ApplicationDetailResponse,
  DatabaseCountResponse,
  EndpointCountResponse,
  AuditsResponse,
} from './types'

const GRAPHQL_ENDPOINT = 'http://localhost:4000/gql'

async function makeGraphQLRequest(query: string, variables: Record<string, unknown> = {}) {
  const token = localStorage.getItem('qb_token')
  if (!token) {
    localStorage.removeItem('qb_token')
    window.location.href = '/signin'
    throw new Error('No authentication token found')
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
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
  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'GraphQL error')
  }

  return data
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

export async function fetchEndpointCount(): Promise<EndpointCountResponse> {
  const query = `
    query Endpoints {
      endpoints {
        totalCount
      }
    }
  `

  return makeGraphQLRequest(query)
}

export async function fetchAudits(appId: string): Promise<AuditsResponse> {
  const query = `
    query Audits($appId: String!) {
      audits(application_id: $appId) {
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
          user_id
        }
      }
    }
  `

  return makeGraphQLRequest(query, { appId })
}

export async function fetchApplicationDetailData(appId: string) {
  const [applicationResponse, databaseResponse, endpointResponse, auditsResponse] = await Promise.all([
    fetchApplicationDetail(appId),
    fetchDatabaseCount(appId),
    fetchEndpointCount(),
    fetchAudits(appId),
  ])

  return {
    application: applicationResponse.data.applications.nodes[0],
    databaseCount: databaseResponse.data.databases.totalCount,
    endpointCount: endpointResponse.data.endpoints.totalCount,
    audits: auditsResponse.data.audits.nodes,
  }
}
