/**
 * Format an ISO date string to YYYY-MM-DD format
 */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-CA')
  } catch {
    return 'Invalid Date'
  }
}

/**
 * Convert database engine string to pretty case
 */
export function engineLabel(engine: string): string {
  const engineMap: Record<string, string> = {
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    sqlite: 'SQLite',
    redis: 'Redis',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
    mariadb: 'MariaDB',
  }

  const normalizedEngine = engine.toLowerCase()
  return engineMap[normalizedEngine] || engine
}

/**
 * Format port number, showing N/A if null or 0
 */
export function formatPort(port: number | null): string {
  if (!port || port === 0) {
    return 'N/A'
  }
  return port.toString()
}

/**
 * Calculate pagination info for display
 */
export function getPaginationInfo(
  offset: number,
  limit: number,
  totalCount: number,
  currentPageCount: number 
) {
  const start = totalCount === 0 ? 0 : offset + 1
  const end = Math.min(offset + currentPageCount, totalCount) 

  return {
    start,
    end,
    total: totalCount,
    hasPrevious: offset > 0,
    hasNext: offset + currentPageCount < totalCount,
  }
}