import { useState, useEffect, useRef } from 'react'
import { fetchDbExploration } from '../api'
import type { Schema, Table, Column, Endpoint } from '../types'

interface SchemaViewerProps {
  isOpen: boolean
  onClose: () => void
  databaseId: string
  databaseName: string
  appId: string
}

export function SchemaViewer({ isOpen, onClose, databaseId, databaseName, appId }: SchemaViewerProps) {
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [columnsByTable, setColumnsByTable] = useState<Record<string, Column[]>>({})
  const [, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTables, setLoadingTables] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [, setSelectedTableId] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen && databaseId) {
      loadSchemaData()
      setTimeout(() => closeButtonRef.current?.focus(), 100)
    }
  }, [isOpen, databaseId, appId])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const loadSchemaData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchDbExploration(databaseId, null, appId)
      setSchemas(response.data.schemas.nodes)
      setTables(response.data.tables.nodes)
      setEndpoints(response.data.endpoints.nodes)
      setColumnsByTable({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema data')
    } finally {
      setLoading(false)
    }
  }

  const handleTableClick = async (tableId: string) => {
    setSelectedTableId(tableId)
    if (columnsByTable[tableId]) return

    try {
      setLoadingTables(prev => ({ ...prev, [tableId]: true }))
      const response = await fetchDbExploration(databaseId, tableId, appId)
      setColumnsByTable(prev => ({ ...prev, [tableId]: response.data.columns.nodes }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table columns')
    } finally {
      setLoadingTables(prev => ({ ...prev, [tableId]: false }))
    }
  }

  const getTablesForSchema = (schemaId: string) => {
    return tables.filter(t => (t as any).schema_id === schemaId)
  }

  // const handleGenerateEndpoint = () => {
  //   console.log('Generate Endpoint clicked', {
  //     databaseId,
  //     appId,
  //     selectedTableId,
  //     selectedSchemaId: selectedTableId ? (tables.find(t => t.id === selectedTableId) as any)?.schema_id : null
  //   })
  // }


  // Helpers to pretty-print column metadata from snake_case fields
  const truthyString = (v?: string | null) =>
    v && v !== '{ false}' && v !== 'false' && v !== '{}' && v.trim() !== '' ? v : ''

  const fkLabel = (c: any) => {
    const schema = truthyString(c.fk_ref_schema)
    const table = truthyString(c.fk_ref_table)
    const col = truthyString(c.fk_ref_column)
    if (schema || table || col) {
      const path = [schema, table, col].filter(Boolean).join('.')
      return path ? `FK → ${path}` : ''
    }
    return ''
  }

  const defaultLabel = (c: any) => {
    const d = truthyString(c.default_value)
    return d ? `Default: ${d}` : ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Slide-over */}
      <aside
        className="fixed top-0 right-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transform translate-x-0 transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{databaseName}</h2>
            <p className="text-sm text-gray-500">ID: {databaseId}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close schema viewer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-2">
              {schemas.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">folder_off</span>
                  <p className="text-sm text-gray-500">No schemas found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {schemas.map((schema) => (
                    <details key={schema.id} className="group">
                      <summary className="flex items-center justify-between p-3 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-600">folder</span>
                          <span className="font-medium text-gray-900">{(schema as any).name}</span>
                        </div>
                        <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180">expand_more</span>
                      </summary>

                      <ul className="pt-2 pl-8 space-y-1">
                        {getTablesForSchema(schema.id).length === 0 ? (
                          <li>
                            <div className="p-2 text-sm text-gray-500">No tables found</div>
                          </li>
                        ) : (
                          getTablesForSchema(schema.id).map((table) => (
                            <li key={table.id}>
                              <details className="group/table">
                                <summary
                                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => handleTableClick(table.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500 text-base">table</span>
                                    <span className="text-sm text-gray-900">{(table as any).name}</span>
                                    {loadingTables[table.id] && (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    )}
                                  </div>
                                  <span className="material-symbols-outlined text-sm transition-transform duration-200 group-open/table:rotate-180">expand_more</span>
                                </summary>

                                <div className="py-2 pl-8 space-y-3 border-l border-gray-200 ml-4 mt-1">
                                  {columnsByTable[table.id] ? (
                                    columnsByTable[table.id].length === 0 ? (
                                      <div className="p-2 text-sm text-gray-500">No columns found</div>
                                    ) : (
                                      <>
                                        {columnsByTable[table.id].map((col: any) => {
                                          const pk = col.is_primary_key
                                          const nn = col.is_nullable === false
                                          const dt = col.data_type
                                          const def = defaultLabel(col)
                                          const fk = fkLabel(col)

                                          return (
                                            <div key={col.id}>
                                              {/* First line: name + data type */}
                                              <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-gray-500 text-sm">horizontal_rule</span>
                                                <div>
                                                  <p className="text-sm font-medium text-gray-900">
                                                    {col.name}{' '}
                                                    <span className="text-xs text-gray-500 font-normal">{dt}</span>
                                                  </p>
                                                </div>
                                              </div>

                                              {/* Second line: badges like in the HTML (PK / NOT NULL / Nullable / Default / FK) */}
                                              <div className="pl-7 mt-1 flex flex-wrap gap-2">
                                                {pk && (
                                                  <span className="text-xs font-semibold text-blue-600">PRIMARY KEY</span>
                                                )}
                                                <span className="text-xs text-gray-600">
                                                  {nn ? 'NOT NULL' : 'Nullable'}
                                                </span>
                                                {def && (
                                                  <span className="text-xs text-gray-600">{def}</span>
                                                )}
                                                {fk && (
                                                  <span className="text-xs text-blue-600">{fk}</span>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}

                                        {/* Meta block */}
                                        <div className="py-2 pl-8 space-y-2 border-l border-gray-200 ml-4">
                                          <p className="text-xs font-semibold text-gray-500">
                                            Columns:{' '}
                                            <span className="font-normal text-gray-900">
                                              {columnsByTable[table.id].length}
                                            </span>
                                          </p>
                                        </div>
                                      </>
                                    )
                                  ) : (
                                    <div className="p-2 text-sm text-gray-500">Click to load columns</div>
                                  )}
                                </div>
                              </details>
                            </li>
                          ))
                        )}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <footer className="p-6 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGenerateEndpoint}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Generate Endpoint
            </button>
          </div>
          <p className="text-xs text-center text-gray-500">
            Connected to App: {appId}
          </p>
        </footer> */}
      </aside>
    </div>
  )
}