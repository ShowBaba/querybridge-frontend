import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Placeholder table utilities
export interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
}

export interface SortConfig<T> {
  key: keyof T
  direction: 'asc' | 'desc'
}

export function sortData<T>(
  data: T[],
  sortConfig: SortConfig<T>
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })
}
