export interface Endpoint {
  id: string
  name: string
  application_id: string
  database_id: string
  table_id: string
  method: string
  limit_default?: number
  order_by?: string
  url?: string
  order_direction?: string
  query?: string
  is_public: boolean
  created_at: string
  updated_at: string
  columns?: string[]
  version?: string
  path?: string
  param_schema?: unknown
  query_schema?: unknown
  body_schema?: unknown
  query_template?: string
}

export interface EndpointsResponse {
  data: {
    endpoints: {
      totalCount: number
      nodes: Endpoint[]
    }
  }
}