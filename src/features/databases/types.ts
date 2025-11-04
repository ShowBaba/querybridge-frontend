export type Database = {
  id: string
  name: string
  db_engine: string
  ssl_mode: string
  host: string
  port: number | null
  database: string
  username: string
  password: string
  application_id: string
  created_at: string
  updated_at: string
}

export type Schema = {
  id: string
  name: string
}

export type Table = {
  id: string
  name: string
  schema_id: string
}

export type Column = {
  id: string
  name: string
}

export type Endpoint = {
  id: string
  name: string
  application_id: string
  database_id: string | null
  table_id: string | null
  is_public: boolean
  limit: number | null
  order_by: string | null
  order_direction: 'ASC' | 'DESC' | null
  query: string
  created_at: string
  updated_at: string | null
  method?: string
  url?: string
}

export type DatabasesResponse = {
  data: {
    databases: {
      totalCount: number
      nodes: Database[]
    }
  }
  errors?: Array<{ message: string }>
}

export type DbExplorationResponse = {
  data: {
    schemas: {
      nodes: Schema[]
    }
    tables: {
      nodes: Table[]
    }
    columns: {
      nodes: Column[]
    }
    endpoints: {
      nodes: Endpoint[]
    }
  }
  errors?: Array<{ message: string }>
}

export type PaginationParams = {
  limit: number
  offset: number
}
