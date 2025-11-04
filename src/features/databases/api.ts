import { getAuthToken } from '@/lib/http'
import { makeGraphQLRequest } from '@/lib/utils'
import { DatabasePayload } from './components/DatabaseFormModal'
import { DatabasesResponse, DbExplorationResponse, Endpoint, PaginationParams } from './types'

const API_BASE_URL = 'http://localhost:4000'


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

export async function deleteDatabase(databaseId: string): Promise<void> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE_URL}/database/${databaseId}/delete`, {
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
    const errText = await res.text()
    throw new Error(`Failed to remove database: ${errText}`)
  }
}

export async function createDatabase(appId: string, payload: DatabasePayload): Promise<void> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE_URL}/database/${appId}/add-database`, {
    method: 'POST',
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
    const errText = await res.text()
    throw new Error(`Failed to create database: ${errText}`)
  }
}

export async function updateDatabase(dbId: string, payload: DatabasePayload): Promise<void> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE_URL}/database/${dbId}/update`, {
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
    const errText = await res.text()
    throw new Error(`Failed to update database: ${errText}`)
  }
}

export async function testDatabaseConnection(
  payload: Omit<DatabasePayload, 'name'>
): Promise<boolean> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE_URL}/database/test-db-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (res.status === 401) {
    localStorage.removeItem('qb_token')
    window.location.href = '/signin'
    throw new Error('Authentication failed')
  }

  let data: any
  try {
    data = await res.json()
  } catch {
    const errText = await res.text()
    throw new Error(`Test connection failed: ${errText}`)
  }

  if (!res.ok || !data?.data?.connection_status) {
    const msg = data?.message || 'Test connection failed'
    const errDetail = data?.data?.error
    throw new Error(errDetail ? `${msg}: ${errDetail}` : msg)
  }

  return true
}

export async function testDatabaseConnectivity(databaseId: string): Promise<boolean> {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/database/${databaseId}/test-connection`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('qb_token')
      window.location.href = '/signin'
      throw new Error('Authentication failed')
    }
    return false
  }

  try {
    const data = await res.json()
    return Boolean(data?.data?.connection_status)
  } catch {
    return false
  }
}

export async function fetchDatabaseById(dbId: string) {
  const query = `
    query DatabaseById($id: String!) {
      databases(id: $id) {
        nodes {
          application_id
          created_at
          database
          db_engine
          host
          id
          name
          password
          port
          updated_at
          username
          ssl_mode
        }
      }
    }
  `
  const res = await makeGraphQLRequest(query, { id: dbId })
  const db = res?.data?.databases?.nodes?.[0] ?? null
  return { data: { database: db } }
}

export async function fetchDatabaseTablesPage(
  database_id: string,
  { limit, offset }: { limit: number; offset: number }
) {
  const query = `
    query TablesByDb($database_id: String!, $limit: Int!, $offset: Int!, $orderBy: String!) {
      tables(database_id: $database_id, limit: $limit, offset: $offset, orderBy: $orderBy) {
        totalCount
        nodes {
          id
          name
          schema_id
          database_id
          created_at
          updated_at
        }
      }
    }
  `
  return makeGraphQLRequest(query, { database_id, limit, offset, orderBy:"name" })
}

export async function fetchTablesTotalCount(
  database_id: string
): Promise<{ data: { tables: { totalCount: number } } }> {
  const query = `
    query Tables($database_id: String!) {
      tables(database_id: $database_id) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { database_id })
}

export async function fetchTablesTotalColumnCount(
  table_id: string
): Promise<{ data: { columns: { totalCount: number } } }> {
  const query = `
    query Columns($table_id: String!) {
      columns(table_id: $table_id) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { table_id })
}

export async function fetchDatabaseSchemasPage(
  database_id: string,
  { limit, offset }: { limit: number; offset: number }
) {
  const query = `
    query SchemasByDb($database_id: String!, $limit: Int!, $offset: Int!) {
      schemas(database_id: $database_id, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          database_id
          created_at
          updated_at
        }
      }
    }
  `
  return makeGraphQLRequest(query, { database_id, limit, offset })
}

export async function fetchTablesPage(
  database_id: string,
  opts: { limit: number; offset: number }
): Promise<{
  data: { tables: { totalCount: number; nodes: Array<{ id: string; name: string; schema_id: string }> } }
}> {
  const query = `
    query Tables($database_id: String!, $limit: Int!, $offset: Int!) {
      tables(database_id: $database_id, limit: $limit, offset: $offset) {
        totalCount
        nodes { id name schema_id }
      }
    }
  `
  return makeGraphQLRequest(query, { database_id, ...opts })
}

export async function fetchTableColumnsPage(
  table_id: string,
  opts: { limit: number; offset: number }
): Promise<{
  data: {
    columns: {
      totalCount: number
      nodes: Array<{
        id: string
        name: string
        data_type: string
        default_value: string | null
        is_nullable: boolean
        is_primary_key: boolean
        fk_constraint: string | null
        fk_ref_schema: string | null
        fk_ref_table: string | null
        fk_ref_column: string | null
        created_at: string
        updated_at: string
      }>
    }
  }
}> {
  const query = `
    query Columns($table_id: String!, $limit: Int!, $offset: Int!) {
      columns(table_id: $table_id, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          data_type
          default_value
          is_nullable
          is_primary_key
          fk_constraint
          fk_ref_schema
          fk_ref_table
          fk_ref_column
          created_at
          updated_at
        }
      }
    }
  `
  return makeGraphQLRequest(query, { table_id, ...opts })
}

export async function fetchEndpointsForTable(
  table_id: string
): Promise<{
  data: {
    endpoints: {
      totalCount: number
      nodes: Array<{
        id: string
        method: string
        url: string
        name: string
        database_id: string
        application_id: string
        table_id: string
        created_at: string
        updated_at: string
        is_public: boolean
      }>
    }
  }
}> {
  const query = `
    query Endpoints($table_id: String!) {
      endpoints(table_id: $table_id) {
        totalCount
        nodes {
          id
          method
          url
          name
          database_id
          application_id
          table_id
          created_at
          updated_at
          is_public
          
        }
      }
    }
  `
  return makeGraphQLRequest(query, { table_id})
}

export async function fetchColumnsTotalCount(
  table_id: string
): Promise<{ data: { columns: { totalCount: number } } }> {
  const query = `
    query ColumnsTotal($table_id: String!) {
      columns(table_id: $table_id) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { table_id })
}

export async function fetchAllUserDatabasesPage(pagination: { limit: number; offset: number }): Promise<{
  data: {
    databases: {
      totalCount: number
      nodes: Array<{
        id: string
        name: string
        db_engine: string
        application_id: string
        created_at: string
      }>
    }
  }
}> {
  const query = `
    query AllDatabasesPage($limit: Int!, $offset: Int!) {
      databases(limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          db_engine
          application_id
          created_at
        }
      }
    }
  `
  // reuse makeGraphQLRequest from same file
  return makeGraphQLRequest(query, { limit: pagination.limit, offset: pagination.offset })
}

export async function fetchUserApplications(): Promise<{
  data: {
    applications: {
      totalCount: number
      nodes: Array<{ id: string; name: string }>
    }
  }
}> {
  const query = `
    query Apps {
      applications {
        totalCount
        nodes { id name }
      }
    }
  `
  return makeGraphQLRequest(query, {})
}

export async function searchAllUserDatabases(term: string): Promise<{
  data: {
    databases: {
      totalCount: number; nodes: Array<{
        id: string; name: string; db_engine: string; application_id: string; created_at: string
      }>
    }
  }
}> {
  const query = `
    query SearchDatabases($name: String!) {
      databases(name: $name) {
        totalCount
        nodes {
          id
          name
          db_engine
          application_id
          created_at
        }
      }
    }
  `
  return makeGraphQLRequest(query, { name: term })
}