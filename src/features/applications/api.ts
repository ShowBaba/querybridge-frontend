import { ApplicationsResponse } from './types'

const GRAPHQL_ENDPOINT = 'http://localhost:4000/gql'

export async function fetchApplications(): Promise<ApplicationsResponse> {
  const token = localStorage.getItem('qb_token')
  if (!token) throw new Error('No authentication token found')

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        query ApplicationsWithCounts {
          applications {
            nodes {
              api_key
              created_at
              id
              name
              updated_at
              user_id
            }
          }
          databases {
            nodes {
              id
              application_id
            }
          }
          endpoints {
            nodes {
              id
              application_id
            }
          }
        }
      `,
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
  if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error')

  return data
}