// Shared types for the application
export interface User {
  id: string
  email: string
  name: string
}

export interface Application {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
