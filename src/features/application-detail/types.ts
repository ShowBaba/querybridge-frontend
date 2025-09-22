export type ApplicationDetail = {
  id: string
  name: string
  api_key: string
  user_id: string
  created_at: string
  updated_at: string | null
}

export type Audit = {
  id: string
  action: string
  application_id: string
  created_at: string
  description: string
  entity_id: string
  entity_type: string
  ip_address: string
  metadata: string
  user_id: string
}

export type ApplicationDetailResponse = {
  data: {
    applications: {
      totalCount: number
      nodes: ApplicationDetail[]
    }
  }
  errors?: Array<{ message: string }>
}

export type DatabaseCountResponse = {
  data: {
    databases: {
      totalCount: number
    }
  }
  errors?: Array<{ message: string }>
}

export type EndpointCountResponse = {
  data: {
    endpoints: {
      totalCount: number
    }
  }
  errors?: Array<{ message: string }>
}

export type AuditsResponse = {
  data: {
    audits: {
      totalCount: number
      nodes: Audit[]
    }
  }
  errors?: Array<{ message: string }>
}
