export type Application = {
  id: string
  name: string
  api_key: string
  user_id: string
  created_at: string
  updated_at: string
}

export type DbNode = { id: string; application_id: string }
export type EndpointNode = { id: string; application_id: string }

export type ApplicationsResponse = {
  data: {
    applications: { nodes: Application[] }
    databases: { nodes: DbNode[] }
    endpoints: { nodes: EndpointNode[] }
  }
  errors?: Array<{ message: string }>
}