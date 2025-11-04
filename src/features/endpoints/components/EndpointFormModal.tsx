import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createEndpoint,
  updateEndpoint,
  previewEndpointSQL,
  fetchDatabaseById,
  fetchTableById,
  fetchTablesByDatabaseId,
  fetchColumnsByTableId,
  fetchDatabasesByAppId,
  type CreateEndpointPayload,
  type UpdateEndpointPayload,
  type EndpointMethod,
  type OrderDirection,
  ApiError,
} from '@/features/endpoints/api'
import { useToast } from '@/components/ui/Toast'
import { Toggle } from '@/components/ui/Toggle'

type Mode = 'create' | 'edit'

type InitialEndpoint = Partial<{
  name: string
  method: EndpointMethod
  table_id: string | number
  columns: string[]
  is_public: boolean
  limit: number
  order_by: string
  order_direction: OrderDirection
  database_id: string | number
  path: string
  version: string
  param_schema: unknown
  query_schema: unknown
  body_schema: unknown
  query_template: string
}>

type Props = {
  isOpen: boolean
  mode: Mode
  appId: string | number
  databaseId?: string
  endpointId?: string
  initial?: InitialEndpoint
  onClose: () => void
  onSaved?: (updatedId?: string) => void
}

function parseHelpfulHints(msg: string): string[] {
  const hints: string[] = []
  if (/NOT NULL column/i.test(msg)) {
    hints.push('Add the missing field(s) to the Body Schema and mark as “Required”, or provide them via Path/Query schema.')
  }
  if (/body_schema/i.test(msg) || /query_schema/i.test(msg) || /param_schema/i.test(msg)) {
    hints.push('Open “Additional optional settings” and review the corresponding schema builder or switch to Raw JSON.')
  }
  if (/endpoint definition invalid/i.test(msg)) {
    hints.push('Check method, path, and selected columns. Preview SQL to validate the generated query.')
  }
  return hints
}

function ErrorCallout({ title = 'Something went wrong', message, hints }: {
  title?: string
  message: string
  hints?: string[]
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <div className="flex items-start gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mt-[2px]">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
        </svg>
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 break-words">{message}</div>
          {hints && hints.length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'
type BuilderRow = { name: string; type: FieldType; required: boolean }

const DEFAULT_TYPES: FieldType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array']

function builderToJsonSchema(rows: BuilderRow[]): any {
  const list = Array.isArray(rows) ? rows : []
  const props: Record<string, any> = {}
  const required: string[] = []

  list.forEach((r) => {
    const key = r.name?.trim()
    if (!key) return
    props[key] = { type: r.type }
    if (r.required) required.push(key)
  })

  const schema: any = { type: 'object', properties: props }
  if (required.length) schema.required = required
  return schema
}

function jsonSchemaToBuilder(json?: any): BuilderRow[] {
  try {
    if (!json || typeof json !== 'object') return []
    const props = (json as any).properties || {}
    const required: string[] = Array.isArray((json as any).required) ? (json as any).required : []
    return Object.keys(props).map((k) => {
      const t = props[k]?.type as FieldType | undefined
      return { name: k, type: (DEFAULT_TYPES.includes(t as FieldType) ? t : 'string') || 'string', required: required.includes(k) }
    })
  } catch {
    return []
  }
}

const fieldControl =
  "w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm leading-[1.25rem] " +
  "focus:outline-none focus:ring-2 focus:ring-[#ec1313]/40 focus:border-[#ec1313]";

function SchemaBuilder({
  rows,
  setRows,
  columns,
  label,
  highlightNames,              // NEW
  fieldErrors,                 // NEW: { [fieldName]: message }
}: {
  rows: BuilderRow[]
  setRows: (r: BuilderRow[]) => void
  columns: Array<{ name: string; data_type?: string }>
  label?: string
  highlightNames?: Set<string>
  fieldErrors?: Record<string, string>
}) {
  const addRow = () => setRows([...rows, { name: '', type: 'string', required: false }])
  const update = (i: number, patch: Partial<BuilderRow>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i))

  const columnNames = new Set(columns.map(c => c.name))

  return (
    <div className="space-y-3">
      {label && <div className="text-sm font-medium text-[#111827]">{label}</div>}

      {rows.length === 0 && (
        <div className="text-sm text-[#6b7280]">No fields. Click “Add field”.</div>
      )}

      {rows.map((r, i) => {
        const inTable = r.name && columnNames.has(r.name)
        const isHot = !!(r.name && highlightNames?.has(r.name))
        const errMsg = r.name ? fieldErrors?.[r.name] : undefined

        return (
          <div key={i} className="grid grid-cols-12 gap-3 items-start">
            {/* Field name */}
            <div className="col-span-6">
              <input
                list="schema-columns"
                value={r.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="field_name"
                className={[
                  "w-full h-10 px-3 rounded-lg border bg-white text-sm leading-[1.25rem] focus:outline-none focus:ring-2",
                  isHot
                    ? "border-red-300 focus:ring-red-300"
                    : "border-gray-200 focus:ring-[#ec1313]/40 focus:border-[#ec1313]",
                ].join(" ")}
                aria-invalid={isHot || undefined}
              />
              <datalist id="schema-columns">
                {columns.map(c => <option key={c.name} value={c.name} />)}
              </datalist>

              {/* match chip OR inline error */}
              {errMsg ? (
                <div className="mt-1 text-xs text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  {errMsg}
                </div>
              ) : r.name ? (
                <div className={[
                  "mt-1 inline-flex text-xs px-1.5 py-0.5 rounded border",
                  inTable
                    ? "text-green-700 bg-green-50 border-green-200"
                    : "text-amber-700 bg-amber-50 border-amber-200",
                ].join(" ")}
                >
                  {inTable ? "matches table column" : "custom key (not a column)"}
                </div>
              ) : null}
            </div>

            {/* Type */}
            <div className="col-span-3">
              <select
                value={r.type}
                onChange={(e) => update(i, { type: e.target.value as FieldType })}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm leading-[1.25rem] pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-[#ec1313]/40 focus:border-[#ec1313]"
              >
                {DEFAULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Required & Remove */}
            <div className="col-span-3">
              <div className="flex items-center justify-between pl-2 pr-2">
                <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={r.required}
                    onChange={(e) => update(i, { required: e.target.checked })}
                  />
                  <span className="select-none">Required</span>
                </label>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-3 w-7 h-7 inline-flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                  title="Remove field"
                  aria-label="Remove field"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
      >
        Add field
      </button>
    </div>
  )
}

export function EndpointFormModal({
  isOpen,
  mode,
  appId,
  databaseId,
  endpointId,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [databases, setDatabases] = useState<Array<{ id: string; name: string }>>([])
  const [dbId, setDbId] = useState<string>('')
  const [dbName, setDbName] = useState<string | null>(null)

  const [tableName, setTableName] = useState<string | null>(null)
  const [tables, setTables] = useState<Array<{ id: string; name: string }>>([])
  const [tableId, setTableId] = useState<string | ''>('')
  const [columns, setColumns] = useState<Array<{ name: string; data_type?: string }>>([])
  const [selectedCols, setSelectedCols] = useState<string[]>([])

  const [name, setName] = useState('')
  const [method, setMethod] = useState<EndpointMethod>('POST')
  const [isPublic, setIsPublic] = useState(false)
  const [limit, setLimit] = useState<number | string>(50)
  const [orderBy, setOrderBy] = useState<string>('id')
  const [orderDir, setOrderDir] = useState<OrderDirection>('ASC')
  const didHydrateEditColsRef = useRef(false)
  const [version, setVersion] = useState<string>('v1')
  const [path, setPath] = useState<string>('')
  const [inferredPath, setInferredPath] = useState<string>('')
  const [editingPath, setEditingPath] = useState<boolean>(false)
  const initialPublicPathRef = useRef<string | null>(null)

  const [paramSchema, setParamSchema] = useState<string>('')
  const [querySchema, setQuerySchema] = useState<string>('')
  const [bodySchema, setBodySchema] = useState<string>('')
  const [queryTemplate, setQueryTemplate] = useState<string>('')

  const [previewing, setPreviewing] = useState(false)
  const [previewSql, setPreviewSql] = useState<string>('')

  const { success: toastSuccess, error: toastError } = useToast()

  type SchemaMode = 'builder' | 'raw'

  const [paramMode, setParamMode] = useState<SchemaMode>('builder')
  const [queryMode, setQueryMode] = useState<SchemaMode>('builder')
  const [bodyMode, setBodyMode] = useState<SchemaMode>('builder')

  const [paramRows, setParamRows] = useState<BuilderRow[]>([])
  const [queryRows, setQueryRows] = useState<BuilderRow[]>([])
  const [bodyRows, setBodyRows] = useState<BuilderRow[]>([])

  const [formError, setFormError] = useState<{ message: string; hints: string[]; fieldErrors?: Record<string, string> } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [problemBodyFields, setProblemBodyFields] = useState<Set<string>>(new Set()) // highlight set
  const [showAdvanced, setShowAdvanced] = useState(false) // control <details>
  const errorRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLDivElement | null>(null)

  function ModeSwitch({
    mode, setMode, id
  }: { mode: SchemaMode; setMode: (m: SchemaMode) => void; id: string }) {
    const base = "px-2 py-1.5 rounded-md border text-xs font-medium transition"
    const active = "border-[#ec1313] ring-1 ring-[#ec1313] text-[#ec1313] bg-[#ec1313]/10"
    const inactive = "border-gray-300 hover:bg-gray-50 text-[#111827]"
    return (
      <div className="inline-flex gap-2" role="tablist" aria-labelledby={id}>
        <button type="button" role="tab" aria-selected={mode === 'builder'}
          className={`${base} ${mode === 'builder' ? active : inactive}`} onClick={() => setMode('builder')}>Builder</button>
        <button type="button" role="tab" aria-selected={mode === 'raw'}
          className={`${base} ${mode === 'raw' ? active : inactive}`} onClick={() => setMode('raw')}>Raw JSON</button>
      </div>
    )
  }

  const toSnake = (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^\w]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()

  const inferPathFromTable = (t?: string | null) => (t ? `/${toSnake(t)}` : '')

  useEffect(() => {
    if (!isOpen) return
    setSaving(false)
    setFormError(null)
    setPreviewError(null)
    setProblemBodyFields(new Set())
    setShowAdvanced(false)

    setName(initial?.name ?? '')
    setMethod(initial?.method ?? 'POST')
    setIsPublic(initial?.is_public ?? false)
    setLimit(initial?.limit ?? 50)
    setOrderBy(initial?.order_by ?? 'id')
    setOrderDir(initial?.order_direction ?? 'ASC')

    setVersion(initial?.version ?? 'v1')
    setParamSchema(initial?.param_schema ? JSON.stringify(initial.param_schema, null, 2) : '')
    setQuerySchema(initial?.query_schema ? JSON.stringify(initial.query_schema, null, 2) : '')
    setBodySchema(initial?.body_schema ? JSON.stringify(initial.body_schema, null, 2) : '')
    setQueryTemplate(initial?.query_template ?? '')

    
    try {
      const pj = initial?.param_schema ? JSON.parse(JSON.stringify(initial.param_schema)) : undefined
      const qj = initial?.query_schema ? JSON.parse(JSON.stringify(initial.query_schema)) : undefined
      const bj = initial?.body_schema ? JSON.parse(JSON.stringify(initial.body_schema)) : undefined
      setParamRows(jsonSchemaToBuilder(pj))
      setQueryRows(jsonSchemaToBuilder(qj))
      setBodyRows(jsonSchemaToBuilder(bj))
    } catch { /* ignore */ }

    const preDb =
      (initial?.database_id ? String(initial.database_id) : undefined) ??
      (databaseId ? String(databaseId) : undefined) ?? ''
    setDbId(preDb)

    const tid = initial?.table_id ? String(initial.table_id) : ''
    setTableId(tid)
    setSelectedCols(initial?.columns ?? [])

    initialPublicPathRef.current = initial?.path ?? null
    setPath(initial?.path ?? '')
    setEditingPath(Boolean(initial?.path))
  }, [isOpen, initial, databaseId])

  useEffect(() => {
    if (!isOpen) return
    if (mode !== 'edit') return
    if (didHydrateEditColsRef.current) return
    if (!columns.length) return

    if (selectedCols.length > 0) {
      didHydrateEditColsRef.current = true
      return
    }

    const fromInitial = (initial?.columns ?? []).filter(n =>
      columns.some(c => c.name === n)
    )

    if (fromInitial.length > 0) {
      setSelectedCols(fromInitial)
      didHydrateEditColsRef.current = true
      return
    }

    if (method !== 'DELETE') {
      setSelectedCols(columns.map(c => c.name))
    } else {
      setSelectedCols([])
    }
    didHydrateEditColsRef.current = true
  }, [isOpen, mode, columns, initial?.columns, method, selectedCols.length])

  useEffect(() => {
    setSelectedCols([])
    setPreviewSql('')
  }, [tableId])

  useEffect(() => {
    if (!isOpen || !appId) return
      ; (async () => {
        try {
          const res = await fetchDatabasesByAppId(String(appId))
          const list = res?.data?.databases?.nodes ?? []
          setDatabases(list)
          if (!dbId && list.length) setDbId(list[0].id)
        } catch {
          setDatabases([])
        }
      })()
  }, [isOpen, appId])

  useEffect(() => {
    didHydrateEditColsRef.current = false
  }, [tableId])

  useEffect(() => {
    if (!isOpen || !dbId) { setDbName(null); return }
    const byList = databases.find(d => d.id === dbId)?.name
    if (byList) { setDbName(byList); return }
    ; (async () => {
      try {
        const db = await fetchDatabaseById(String(dbId))
        setDbName(db?.data?.databases?.nodes?.[0]?.name ?? null)
      } catch {
        setDbName(null)
      }
    })()
  }, [isOpen, dbId, databases])

  useEffect(() => {
    if (!isOpen || !dbId) { setTables([]); return }
    ; (async () => {
      try {
        const res = await fetchTablesByDatabaseId(String(dbId))
        const list = res?.data?.tables?.nodes ?? []
        setTables(list)

        if (mode === 'create' && list.length && !tableId) setTableId(list[0].id)
        if (tableId && !list.some(t => String(t.id) === String(tableId))) {
          setTableId(list[0]?.id ?? '')
        }
      } catch {
        setTables([])
        setTableId('')
      }
    })()
  }, [isOpen, dbId])

  useEffect(() => {
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      setBodyMode('builder')
      // If no body fields yet, propose table columns as optional (not required)
      if (bodyRows.length === 0 && columns.length > 0) {
        setBodyRows(columns.map(c => ({ name: c.name, type: 'string', required: false })))
      }
    } else {
      setBodyMode('raw')
    }
  }, [method])

  useEffect(() => {
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyRows.length === 0 && columns.length > 0) {
      setBodyRows(columns.map(c => ({ name: c.name, type: 'string', required: false })))
    }
  }, [columns, method])

  useEffect(() => {
    if (!isOpen || !tableId) { setColumns([]); setTableName(null); return }
    ; (async () => {
      try {
        const t = await fetchTableById(String(tableId))
        const tName = t?.data?.tables?.nodes?.[0]?.name ?? null
        setTableName(tName)

        const inferred = inferPathFromTable(tName)
        setInferredPath(inferred)
        if (!editingPath && !initial?.path) setPath(inferred)
      } catch {
        setTableName(null)
        setInferredPath('')
      }
      try {
        const res = await fetchColumnsByTableId(String(tableId))
        const cols = res?.data?.columns?.nodes ?? []
        setColumns(cols)

        if (!initial?.order_by) {
          const hasId = cols.find(c => c.name === 'id')
          setOrderBy(prev => prev || (hasId ? 'id' : cols[0]?.name || 'id'))
        }
      } catch {
        setColumns([])
      }
    })()
  }, [isOpen, tableId])

  const toggleCol = (c: string) =>
    setSelectedCols(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const canSubmit = useMemo(() => {
    const needsLimit = method === 'GET'
    const needsOrder = method === 'GET'
    const needsColumns = method !== 'DELETE'

    const basic =
      !!name.trim() &&
      !!method &&
      !!dbId &&
      !!tableId &&
      !!version.trim() &&
      !!path.trim() &&
      (!needsColumns || selectedCols.length > 0) &&
      (!needsLimit || String(limit).trim() !== '') &&
      (!needsOrder || (!!orderBy && !!orderDir))

    return mode === 'create' ? basic && !!appId : basic && !!endpointId && !!appId
  }, [mode, name, method, dbId, tableId, selectedCols, limit, orderBy, orderDir, appId, endpointId, version, path, queryTemplate])

  const canPreview = useMemo(() => {
    return Boolean(
      dbId &&
      tableId &&
      method &&
      path.trim()
    )
  }, [name, dbId, tableId, method, path])

  const parseJsonOrNull = (s: string) => {
    if (!s || !s.trim()) return undefined
    try { return JSON.parse(s) } catch { return undefined }
  }

  function hintsFromProblem(message: string, fieldErrors?: Record<string, string>): string[] {
    const hints: string[] = []
    if (fieldErrors && Object.keys(fieldErrors).length) {
      hints.push('Add the missing field(s) in Body Schema and mark them as “Required”, or provide them via Path/Query.')
    }
    if (/endpoint definition invalid/i.test(message)) {
      hints.push('Check method, path, and selected columns. Use “Preview SQL” to validate the generated query.')
    }
    return hints
  }

  function scrollErrorIntoView() {
    const container = mainRef.current
    const target = errorRef.current
    if (!container || !target) return
    const cRect = container.getBoundingClientRect()
    const tRect = target.getBoundingClientRect()
    const offset = tRect.top - cRect.top + container.scrollTop - 16 // 16px padding

    container.scrollTo({ top: offset, behavior: 'smooth' })
    target.focus({ preventScroll: true })
  }

  function ErrorCallout({
    title,
    message,
    hints,
    fields, 
  }: {
    title: string
    message: string
    hints?: string[]
    fields?: Array<{ name: string; message: string }>
  }) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <div className="font-semibold">{title}</div>
        <div className="mt-1 break-words">{message}</div>

        {fields && fields.length > 0 && (
          <div className="mt-2">
            <div className="font-medium mb-1">Fix these fields:</div>
            <ul className="space-y-1">
              {fields.map(({ name, message }, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="inline-flex items-center rounded-md border border-red-200 bg-white px-1.5 py-0.5 text-xs font-medium text-red-700">
                    {name}
                  </span>
                  <span className="text-[13px] leading-5">{message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hints && hints.length > 0 && (
          <ul className="mt-3 list-disc pl-5 space-y-1">
            {hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        )}
      </div>
    )
  }

  const buildCreatePayload = (): CreateEndpointPayload => {
    const payload: CreateEndpointPayload = {
      name: name.trim(),
      application_id: String(appId),
      database_id: dbId,
      table_id: tableId,
      method,
      is_public: isPublic,
      columns: method === 'DELETE' ? [] : selectedCols,
      version: version.trim(),
      path: path.trim(),
      ...(method === 'GET' ? {
        limit_default: Number(limit),
        order_by: orderBy,
        order_direction: orderDir,
      } : {}),
      ...(method !== 'GET' && method !== 'DELETE' ? {
        query_template: queryTemplate.trim(),
      } : {}),
      param_schema: parseJsonOrNull(paramSchema),
      query_schema: parseJsonOrNull(querySchema),
      body_schema: method === 'GET' ? undefined : parseJsonOrNull(bodySchema),
    }
    return payload
  }

  const buildUpdatePayload = (): UpdateEndpointPayload => {
    const payload: UpdateEndpointPayload = {
      name: name.trim(),
      application_id: String(appId),
      database_id: dbId,
      table_id: tableId,
      method,
      columns: method === 'DELETE' ? [] : selectedCols,
      is_public: isPublic,
      version: version.trim(),
      path: path.trim(),
      ...(method === 'GET' ? {
        limit_default: Number(limit),
        order_by: orderBy,
        order_direction: orderDir,
      } : {}),
      ...(method !== 'GET' && method !== 'DELETE' ? {
        query_template: queryTemplate.trim(),
      } : {}),
      param_schema: parseJsonOrNull(paramSchema),
      query_schema: parseJsonOrNull(querySchema),
      body_schema: method === 'GET' ? undefined : parseJsonOrNull(bodySchema), // hide for GET
    }
    return payload
  }

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    setFormError(null)

    try {
      if (mode === 'create') {
        const res = await createEndpoint(buildCreatePayload())
        toastSuccess('Endpoint created successfully')
        onClose()
        onSaved?.(res?.data?.id)
      } else {
        const res = await updateEndpoint(String(endpointId), buildUpdatePayload())
        toastSuccess('Endpoint updated successfully')
        onClose()
        onSaved?.(res?.data?.id ?? String(endpointId))
      }
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status >= 500) {
          toastError(e.message)
        } else {
          const errs = Array.isArray((e as any).data?.errors)
            ? ((e as any).data.errors as Array<{ field?: string; message?: string }>)
            : []

          const fieldErrors: Record<string, string> = {}
          const fieldNames = new Set<string>()
          const fieldList: Array<{ name: string; message: string }> = []

          errs.forEach(x => {
            const name = (x.field ?? '').trim()
            const msg = x.message ?? ''
            if (name) {
              fieldErrors[name] = msg
              fieldNames.add(name)
              fieldList.push({ name, message: msg })
            }
          })

          setProblemBodyFields(fieldNames)      
          setShowAdvanced(true)              

          setFormError({
            message: e.message,
            hints: hintsFromProblem(e.message, fieldErrors),
            fieldErrors,                    
            fields: fieldList,            
          } as any)

          requestAnimationFrame(() => {
            requestAnimationFrame(scrollErrorIntoView)
          })

          queueMicrotask(() =>
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          )
        }
      } else {
        toastError('Request failed. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const onPreviewSql = async () => {
    if (!canPreview) return
    setPreviewing(true)
    setPreviewSql('')
    setPreviewError(null)
    try {
      const payload = mode === 'create' ? buildCreatePayload() : buildUpdatePayload()
      const res = await previewEndpointSQL(payload)
      const sql = res?.data?.sql || res?.sql || ''
      setPreviewSql(sql || '-- No SQL was generated.')
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status >= 500) {
          toastError(e.message)
          setPreviewSql('-- Preview failed due to a server error.')
        } else {
          setPreviewError(e.message)
          setPreviewSql(`-- ${e.message}`)
        }
      } else {
        toastError('Preview failed. Please try again.')
        setPreviewSql('-- Preview failed.')
      }
    } finally {
      setPreviewing(false)
    }
  }

  const urlChangeWarning =
    mode === 'edit' &&
    isPublic &&
    initialPublicPathRef.current &&
    initialPublicPathRef.current !== path.trim()

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[12000] pointer-events-auto"
      onClick={() => !saving && onClose()}
      aria-modal
      role="dialog"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden relative z-[12001]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {mode === 'create' ? 'Create Endpoint' : 'Edit Endpoint'}
            </h2>
            <p className="text-xs text-[#6b7280] mt-1">
              {dbName ? `Database: ${dbName}` : 'Select a database'} {tableName ? `• Table: ${tableName}` : ''}
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="text-gray-400 hover:text-[#111827]"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <main
          ref={mainRef}
         className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="space-y-4">
            {formError && (
              <div ref={errorRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive">
                <ErrorCallout
                  title="We couldn’t save your endpoint"
                  message={formError.message}
                  hints={formError.hints}
                  fields={(formError as any).fields}  
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827]" htmlFor="ep-name">Endpoint Name</label>
                <input
                  id="ep-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., List recent orders"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827]" htmlFor="ep-method">Method</label>
                <select
                  id="ep-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as EndpointMethod)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                >
                  {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827]" htmlFor="ep-version">Version</label>
                <input
                  id="ep-version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#111827]">Path</label>
                <div className="relative">
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder={inferredPath || '/table_name'}
                    className="w-full pr-10 px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-gray-100 text-[#111827]"
                    title={editingPath ? 'Stop editing' : 'Edit path'}
                    onClick={() => setEditingPath(e => !e)}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M229.66,77.66,178.34,26.34a8,8,0,0,0-11.31,0L57.37,136a8,8,0,0,0-2.11,3.73L48.06,181a8,8,0,0,0,9.21,9.21l41.25-7.2a8,8,0,0,0,3.73-2.11L229.66,88.97A8,8,0,0,0,229.66,77.66Z" />
                    </svg>
                  </button>
                </div>
                {!editingPath && inferredPath && (
                  <p className="text-xs text-[#6b7280]">
                    Suggested from table: <span className="font-mono">{inferredPath}</span>
                  </p>
                )}
                {urlChangeWarning && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Warning: Changing the path will break the existing public URL.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]" htmlFor="ep-db">Database</label>
              <select
                id="ep-db"
                value={dbId}
                onChange={(e) => setDbId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
              >
                <option value="" disabled>Select a database</option>
                {databases.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827]" htmlFor="ep-table">Table</label>
              <select
                id="ep-table"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                disabled={!dbId}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313] disabled:opacity-50"
              >
                <option value="" disabled>{dbId ? 'Select a table' : 'Select a database first'}</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {method !== 'DELETE' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#111827]">Columns</label>
                  <div className="text-xs text-[#6b7280]">
                    {selectedCols.length}/{columns.length} selected
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {columns.length === 0 ? (
                    <span className="text-sm text-[#6b7280]">No columns</span>
                  ) : (
                    columns.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => toggleCol(c.name)}
                        className={`px-3 py-1.5 rounded-md border text-sm transition ${selectedCols.includes(c.name)
                          ? 'border-[#ec1313] ring-1 ring-[#ec1313] text-[#ec1313] bg-[#ec1313]/10'
                          : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        title={c.data_type || ''}
                      >
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 ${method === 'GET' ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-4`}>
              {method === 'GET' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="ep-limit">Default Limit</label>
                    <input
                      id="ep-limit"
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="ep-order-by">Order By</label>
                    <select
                      id="ep-order-by"
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    >
                      {columns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]">Order Direction</label>
                    <div className="flex gap-2">
                      {(['ASC', 'DESC'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setOrderDir(opt)}
                          className={`px-3 py-1.5 rounded-md border text-sm transition ${orderDir === opt
                            ? 'border-[#ec1313] ring-1 ring-[#ec1313] text-[#ec1313] bg-[#ec1313]/10'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <details className="group border border-gray-200 rounded-lg" open={showAdvanced}>
              <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827]">Additional optional settings</span>
                <svg className="w-4 h-4 text-[#6b7280] transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
              </summary>
              <div className="p-4 pt-0 space-y-4">
                {method !== 'GET' && method !== 'DELETE' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="ep-query-template">
                      SQL Template (query_template)
                    </label>
                    <textarea
                      id="ep-query-template"
                      value={queryTemplate}
                      onChange={(e) => setQueryTemplate(e.target.value)}
                      placeholder="e.g., INSERT INTO orders (customer_id, status, total) VALUES (:customer_id, :status, :total)"
                      className="w-full min-h-[100px] px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-sm text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#111827]" id="label-param-schema">
                      Path Params Schema (e.g. /:id)
                    </label>
                    <ModeSwitch mode={paramMode} setMode={setParamMode} id="label-param-schema" />
                  </div>

                  {paramMode === 'builder' ? (
                    <SchemaBuilder
                      rows={paramRows}
                      setRows={(r) => {
                        setParamRows(r)
                        const json = JSON.stringify(builderToJsonSchema(r), null, 2)
                        setParamSchema(json)
                      }}
                      columns={columns}
                      highlightNames={problemBodyFields}                    
                      fieldErrors={formError?.fieldErrors}
                    />
                  ) : (
                    <textarea
                      value={paramSchema}
                      onChange={(e) => {
                        setParamSchema(e.target.value)
                        try { setParamRows(jsonSchemaToBuilder(JSON.parse(e.target.value))) } catch { /* ignore */ }
                      }}
                      placeholder='{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}'
                      className="w-full min-h-[120px] px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-xs text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#111827]" id="label-query-schema">
                      Query Schema (e.g. ?complete_kyc=true)
                    </label>
                    <ModeSwitch mode={queryMode} setMode={setQueryMode} id="label-query-schema" />
                  </div>

                  {queryMode === 'builder' ? (
                    <SchemaBuilder
                      rows={queryRows}
                      setRows={(r) => {
                        setQueryRows(r)
                        const json = JSON.stringify(builderToJsonSchema(r), null, 2)
                        setQuerySchema(json)
                      }}
                      columns={columns}
                    />
                  ) : (
                    <textarea
                      value={querySchema}
                      onChange={(e) => {
                        setQuerySchema(e.target.value)
                        try { setQueryRows(jsonSchemaToBuilder(JSON.parse(e.target.value))) } catch { /* ignore */ }
                      }}
                      placeholder='{"type":"object","properties":{"debug":{"type":"boolean"}}}'
                      className="w-full min-h-[120px] px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-xs text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    />
                  )}
                </div>

                {method !== 'GET' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-[#111827]" id="label-body-schema">
                        Body Schema (JSON)
                      </label>
                      <ModeSwitch mode={bodyMode} setMode={setBodyMode} id="label-body-schema" />
                    </div>

                    {bodyMode === 'builder' ? (
                      <SchemaBuilder
                        rows={bodyRows}
                        setRows={(r) => {
                          setBodyRows(r)
                          const json = JSON.stringify(builderToJsonSchema(r), null, 2)
                          setBodySchema(json)
                        }}
                        columns={columns}
                      />
                    ) : (
                      <textarea
                        value={bodySchema}
                        onChange={(e) => {
                          setBodySchema(e.target.value)
                          try { setBodyRows(jsonSchemaToBuilder(JSON.parse(e.target.value))) } catch { /* ignore */ }
                        }}
                        placeholder='{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}'
                        className="w-full min-h-[120px] px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-xs text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                      />
                    )}

                    {['POST', 'PUT', 'PATCH'].includes(method) && (
                      <p className="text-xs text-[#6b7280]">
                        Tip: define the request body shape (drag in columns via Builder, or switch to Raw JSON).
                      </p>
                    )}
                  </div>
                )}
              </div>
            </details>

            <Toggle
              value={isPublic}
              onChange={setIsPublic}
              hint={isPublic ? "Visible without auth." : "Requires auth."}
            />

            {previewError && (
              <ErrorCallout title="Preview failed" message={previewError} hints={hintsFromProblem(previewError)} />
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#111827]">Generated SQL Preview</span>
                <button
                  type="button"
                  onClick={onPreviewSql}
                  disabled={previewing || !canPreview}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                  title={canPreview ? 'Preview generated SQL' : 'Fill required fields (name, method, database, table, path)'}
                >
                  {previewing ? 'Generating…' : 'Preview SQL'}
                </button>
              </div>
              <pre className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 font-mono overflow-x-auto min-h-[80px]">
                {previewSql || '-- Click "Preview SQL" once the required fields are set.'}
              </pre>
            </div>
          </div>
        </main>

        <footer className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={() => !saving && onClose()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ec1313]"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || saving || (mode === 'edit' && !endpointId)}
            className="rounded-lg bg-[#ec1313] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#ec1313]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#ec1313]"
            type="button"
          >
            {saving ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Endpoint' : 'Save Changes')}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  )
}
