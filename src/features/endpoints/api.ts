import { getAuthToken } from "@/lib/http"
import { makeGraphQLRequest } from "@/lib/utils"

const API_BASE_URL = 'http://localhost:4000'

export type ScriptKind = 'pre' | 'post'
export type ScriptLang = 'js'

export type EndpointScriptDef = {
  kind: ScriptKind
  lang: ScriptLang
  enabled: boolean
  script_timeout_ms?: number
  code: string
}

export type ScriptPreviewRequest = {
  kind: ScriptKind
  lang: ScriptLang
  timeout_ms?: number
  code: string
  request: {
    headers?: Record<string, string>
    pathParams?: Record<string, string>
    query?: Record<string, unknown>
    body?: unknown
    values?: unknown[]
  }
}

export type ScriptPreviewResponse = {
  status: number
  message: string
  data?: {
    abort?: { message?: string } | null
    mutate?: {
      headers?: Record<string, string>
      pathParams?: Record<string, string>
      query?: Record<string, unknown>
      body?: unknown
      values?: unknown[]
    } | null
  }
}



export async function fetchEndpointsTotalCount(
  application_id: string
): Promise<{ data: { endpoints: { totalCount: number } } }> {
  const query = `
    query Endpoints($application_id: String!) {
      endpoints(application_id: $application_id) {
        totalCount
      }
    }
  `
  return makeGraphQLRequest(query, { application_id })
}

export async function fetchEndpoints(appId: string, limit = 10, offset = 0) {
  const query = `
    query Endpoints($appId: String!, $limit: Int, $offset: Int) {
      endpoints(application_id: $appId, limit: $limit, offset: $offset) {
        totalCount
        nodes {
          id
          name
          application_id
          database_id
          table_id
          limit_default
          order_by
          order_direction
          method
          url
          columns
          version
          path
          param_schema
          query_schema
          body_schema
          query_template
          is_public
          created_at
          updated_at
        }
      }
    }
  `

  return makeGraphQLRequest(query, { appId, limit, offset })
}

export async function fetchEndpointById(id: string) {
  const query = `
    query EndpointById($id: String!) {
      endpoints(id: $id) {
        totalCount
        nodes {
          application_id
          database_id
          created_at
          database_id
          limit_default
          id
          is_public
          method
          name
          order_by
          order_direction
          table_id
          updated_at
          url
          columns
          version
          path
          param_schema
          query_schema
          body_schema
          query_template
        }
      }
    }
  `
  return makeGraphQLRequest(query, { id })
}

export async function fetchDatabaseById(dbId: string): Promise<{
  data: { databases: { totalCount: number; nodes: Array<{ id: string; name: string }> } }
}> {
  const query = `
    query DatabaseById($id: String!) {
      databases(id: $id) {
        totalCount
        nodes { id name }
      }
    }
  `;
  return makeGraphQLRequest(query, { id: dbId });
}

export async function fetchTableById(tableId: string): Promise<{
  data: { tables: { totalCount: number; nodes: Array<{ id: string; name: string }> } }
}> {
  const query = `
    query TableById($id: String!) {
      tables(id: $id) {
        totalCount
        nodes { id name }
      }
    }
  `;
  return makeGraphQLRequest(query, { id: tableId });
}


export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type OrderDirection = 'ASC' | 'DESC'

export type CreateEndpointPayload = {
  name: string
  application_id: string | number
  database_id: string | number
  table_id: string | number
  method: EndpointMethod
  columns: string[]
  is_public: boolean
  version: string
  path: string
  limit_default?: number
  limit_max?: number
  order_by?: string
  order_direction?: OrderDirection
  timeout_ms?: number
  query_template?: string
  param_schema?: unknown
  query_schema?: unknown
  body_schema?: unknown
  pre_script?: EndpointScriptDef
  post_script?: EndpointScriptDef
}

export type UpdateEndpointPayload = {
  name?: string
  application_id?: string | number
  database_id?: string | number
  table_id?: string | number
  method?: EndpointMethod
  columns?: string[]
  is_public?: boolean
  version?: string
  path?: string
  limit_default?: number
  limit_max?: number
  order_by?: string
  order_direction?: OrderDirection
  timeout_ms?: number
  query_template?: string
  param_schema?: unknown
  query_schema?: unknown
  body_schema?: unknown
  pre_script?: EndpointScriptDef
  post_script?: EndpointScriptDef
}

export class ApiError extends Error {
  status: number
  data?: unknown
  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function readProblem(res: Response) {
  try {
    const j = await res.json()
    return {
      message: j?.message || res.statusText || 'Request failed',
      status: j?.status || res.status,
      data: j?.data,
    }
  } catch {
    return { message: res.statusText || 'Request failed', status: res.status, data: undefined }
  }
}

export async function createEndpoint(payload: CreateEndpointPayload) {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/endpoint/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const p = await readProblem(res)
    throw new ApiError(p.message, p.status, p.data)
  }
  return res.json()
}

export async function updateEndpoint(
  endpointId: string,
  payload: UpdateEndpointPayload
) {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/endpoint/${endpointId}/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const p = await readProblem(res)
    throw new ApiError(p.message, p.status, p.data)
  }
  return res.json()
}

export async function previewEndpointSQL(payload: Partial<CreateEndpointPayload & UpdateEndpointPayload>) {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/endpoint/preview-sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const p = await readProblem(res)
    throw new ApiError(p.message, p.status, p.data)
  }
  return res.json()
}

async function safeErr(res: Response) {
  try {
    const j = await res.json()
    return j?.message || JSON.stringify(j)
  } catch {
    return res.statusText
  }
}

export async function deleteEndpoint(id: string) {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/endpoint/${id}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const p = await readProblem(res)
    throw new ApiError(p.message, p.status, p.data)
  }
  return res.json()
}

export async function fetchTablesByDatabaseId(dbId: string): Promise<{
  data: { tables: { totalCount: number; nodes: Array<{ id: string; name: string }> } }
}> {
  const query = `
    query TablesByDb($id: String!) {
      tables(database_id: $id) {
        totalCount
        nodes { id name }
      }
    }
  `
  return makeGraphQLRequest(query, { id: dbId })
}

export async function fetchColumnsByTableId(tableId: string): Promise<{
  data: { columns: { totalCount: number; nodes: Array<{ name: string; data_type?: string }> } }
}> {
  const query = `
    query ColumnsByTable($id: String!) {
      columns(table_id: $id) {
        totalCount
        nodes { name data_type }
      }
    }
  `
  return makeGraphQLRequest(query, { id: tableId })
}

export async function fetchDatabasesByAppId(appId: string) {
  const query = `
    query Databases($appId: String!, $limit: Int, $offset: Int) {
      databases(application_id: $appId, limit: $limit, offset: $offset) {
        totalCount
        nodes { id name }
      }
    }
  `
  return makeGraphQLRequest(query, { appId, limit: 1000, offset: 0 })
}


export async function previewEndpointScript(payload: ScriptPreviewRequest): Promise<{ data: ScriptPreviewResponse }> {
  const token = await getAuthToken()
  const res = await fetch(`${API_BASE_URL}/endpoint/scripts/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const p = await readProblem(res)
    throw new ApiError(p.message, p.status, p.data)
  }
  const json = await res.json()
  return { data: json as ScriptPreviewResponse }
}

export type EndpointScriptNode = {
  id: string
  endpoint_id: string | null
  kind: 'pre' | 'post'
  lang: 'js' | 'ts' | string
  code: string
  enabled: boolean
  script_timeout_ms: number | null
  created_at: string
  updated_at: string
}

export async function fetchEndpointScripts(endpointId: string): Promise<EndpointScriptNode[]> {
  const query = `
    query EndpointScript($endpoint_id: String!) {
      endpointScript(endpoint_id: $endpoint_id) {
        totalCount
        nodes {
          id
          endpoint_id
          kind
          lang
          code
          enabled
          script_timeout_ms
          created_at
          updated_at
        }
      }
    }
  `
  const variables = { endpoint_id: endpointId }
  const res = await makeGraphQLRequest(query, variables)
  return res?.data?.endpointScript?.nodes ?? []
}