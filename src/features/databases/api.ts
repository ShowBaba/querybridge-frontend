import { DatabasesResponse, DbExplorationResponse, Endpoint, PaginationParams } from './types'

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

export async function fetchDatabasesPage(
  application_id: string,
  pagination: PaginationParams
): Promise<DatabasesResponse> {
  const query = `
    query Databases($application_id: String!, $limit: Int!, $offset: Int!) {
      databases(application_id: $application_id, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          application_id
          created_at
          database
          db_engine
          host
          name
          password
          port
          updated_at
          username
          id
        }
      }
    }
  `
  return makeGraphQLRequest(query, {
    application_id,
    limit: pagination.limit,
    offset: pagination.offset,
  })
}

export async function fetchDatabasesTotalCount(
  application_id: string
): Promise<{ data: { databases: { totalCount: number } } }> {
  const query = `
    query Databases($application_id: String!) {
      databases(application_id: $application_id) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { application_id })
}

export async function fetchDatabases(
  application_id: string,
  pagination: PaginationParams
): Promise<DatabasesResponse> {
  return fetchDatabasesPage(application_id, pagination)
}

export async function fetchDbExploration(
  dbId: string,
  table_id: string | null,
  app_id: string,
  colLimit = 200
): Promise<DbExplorationResponse> {
  const query = `
    query DbExploration($dbId: String!, $table_id: String, $app_id: String!, $colLimit: Int!) {
      schemas(database_id: $dbId) {
        nodes {
          id
          name
        }
      }
      tables(database_id: $dbId) {
        nodes {
          id
          name
          schema_id
        }
      }
      columns(limit: $colLimit, table_id: $table_id) {
        nodes {
          id
          table_id
          user_id
          name
          data_type
          is_nullable
          default_value
          is_primary_key
          fk_ref_schema
          fk_ref_table
          fk_ref_column
          fk_constraint
          created_at
          updated_at
        }
      }
      endpoints(application_id: $app_id) {
        nodes {
          id
          name
          database_id
          table_id
          is_public
          created_at
        }
      }
    }
  `

  return makeGraphQLRequest(query, {
    dbId,
    table_id,
    app_id,
    colLimit,
  })
}

export async function fetchEndpointsPage(
  applicationId: string,
  pagination: { limit: number; offset: number }
) {
  const query = `
    query EndpointsPage($app_id: String!, $limit: Int!, $offset: Int!) {
      endpoints(application_id: $app_id, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          method
          database_id
          created_at
          url
          is_public
          table_id
          limit
          order_by
          order_direction
          query
          updated_at
          application_id
        }
      }
      databases(application_id: $app_id) {
        nodes {
          id
          name
        }
      }
    }
  `
  return makeGraphQLRequest(query, {
    app_id: applicationId,
    limit: pagination.limit,
    offset: pagination.offset,
  })
}

export async function fetchEndpointsTotalCount(applicationId: string) {
  const query = `
    query EndpointsTotal($applicationId: String!) {
      endpoints(ApplicationID: $applicationId) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { applicationId })
}

export async function fetchEndpointsForApp(
  app_id: string
): Promise<{ data: { endpoints: { nodes: Endpoint[] } } }> {
  const query = `
    query Endpoints($app_id: String!) {
      endpoints(application_id: $app_id) {
        nodes {
          id
          name
          database_id
          table_id
          is_public
          created_at
        }
      }
    }
  `
  return makeGraphQLRequest(query, { app_id })
}