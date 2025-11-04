import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { DocTooltip } from '../components/DocTooltip' 
import {
  deleteEndpoint, EndpointMethod, fetchDatabaseById,
  fetchEndpointById, fetchTableById,
  OrderDirection,
  previewEndpointScript,
  updateEndpoint,
  type EndpointScriptDef,
  type ScriptKind,
  type ScriptPreviewRequest,
  fetchEndpointScripts,
  type EndpointScriptNode,
} from '@/features/endpoints/api'
import type { Endpoint } from '../types'
import { EndpointFormModal } from '../components/EndpointFormModal'
import { createPortal } from 'react-dom'
import { CodeEditor } from '../components/CodeEditor'


async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    return true
  } catch {
    return false
  }
}

export default function EndpointDetailsPage() {
  const { appId, endpointId } = useParams<{ appId: string; endpointId: string }>()
  const { success, error } = useToast()
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ep, setEp] = useState<Endpoint | null>(null)

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'custom' | 'logs'>('general')
  const [copied, setCopied] = useState(false)
  const [dbName, setDbName] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)
  const [confirmEp, setConfirmEp] = useState<Endpoint | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  //   const [buildQuery, setBuildQuery] = useState(`// This hook is not defined for this endpoint.\n`)
  //   const [afterQuery, setAfterQuery] = useState(`// This hook is not defined for this endpoint.\n`)
  //   const [beforeResponse, setBeforeResponse] = useState(
  //     `function beforeResponse(response, context) {
  //   console.log('Executing Before Response Hook');
  //   if (response.data) {
  //     response.data.processed = true;
  //   }
  //   return response;
  // }`
  //   )

  const [preEnabled, setPreEnabled] = useState<boolean>(false)
  const [preTimeout, setPreTimeout] = useState<number>(300)
  const [preCode, setPreCode] = useState<string>(
    `// This script runs before your endpoint executes its SQL query.
// You can inspect, validate, or modify request data dynamically.
//
// Available variables:
//   req.headers      → object of incoming HTTP headers
//   req.pathParams   → route parameters (e.g. /users/:id)
//   req.query        → query params (?limit=10)
//   req.body         → parsed JSON body (if any)
//   env              → environment info { version, appSlug }`
  )

  const [postEnabled, setPostEnabled] = useState<boolean>(false)
  const [postTimeout, setPostTimeout] = useState<number>(300)
  const [postCode, setPostCode] = useState<string>(
    `// Post (response) script
// Example:
if (res.status >= 500) {
  abort("Server returned error", 502);
}

mutate({
  status: 200,
  body: { ...res.body, processed_at: env.now() },
});`
  )

  const [previewKind, setPreviewKind] = useState<ScriptKind>('pre')
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<any>(null)


  const [sampleRequest, setSampleRequest] = useState<string>(() => JSON.stringify({
    headers: { "x-api-key": "abc123" },
    pathParams: { id: "42" },
    query: { q: "hello" },
    body: { name: "Arie" },
  }, null, 2))

  const [scriptSaved, setScriptSaved] = useState(true)

  async function reloadEndpoint() {
    if (!endpointId) return
    try {
      setLoading(true)
      setLoadError(null)
      const res = await fetchEndpointById(endpointId)
      const node: Endpoint | undefined = res?.data?.endpoints?.nodes?.[0]
      if (!node) {
        setLoadError('Endpoint not found')
        return
      }
      setEp(node)

      try {
        if (node.database_id) {
          const dbRes = await fetchDatabaseById(node.database_id)
          setDbName(dbRes?.data?.databases?.nodes?.[0]?.name ?? null)
        } else setDbName(null)
      } catch { setDbName(null) }

      try {
        if (node.table_id) {
          const tRes = await fetchTableById(node.table_id)
          setTableName(tRes?.data?.tables?.nodes?.[0]?.name ?? null)
        } else setTableName(null)
      } catch { setTableName(null) }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load endpoint')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!endpointId) return
      try {
        setLoading(true)
        setLoadError(null)

        const res = await fetchEndpointById(endpointId)
        const node: Endpoint | undefined = res?.data?.endpoints?.nodes?.[0]



        try {
          const scripts = await fetchEndpointScripts(endpointId)

          const pickLatest = (arr: EndpointScriptNode[], kind: 'pre' | 'post') =>
            arr
              .filter(s => s.kind === kind)
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

          const latestPre = pickLatest(scripts, 'pre')
          if (latestPre) {
            setPreEnabled(!!latestPre.enabled)
            setPreTimeout(latestPre.script_timeout_ms ?? 300)
            setPreCode(latestPre.code || preCode)
          } else {
          }

          const latestPost = pickLatest(scripts, 'post')
          if (latestPost) {
            setPostEnabled(!!latestPost.enabled)
            setPostTimeout(latestPost.script_timeout_ms ?? 300)
            setPostCode(latestPost.code || postCode)
          } else {
          }
        } catch {

        }

        if (!cancelled) {
          if (!node) {
            setLoadError('Endpoint not found')
          } else {
            setEp(node)
            if (node.database_id) {
              try {
                const dbRes = await fetchDatabaseById(node.database_id)
                const name = dbRes?.data?.databases?.nodes[0]?.name ?? null
                if (!cancelled) setDbName(name)
              } catch {
                if (!cancelled) setDbName(null)
              }
            } else {
              setDbName(null)
            }

            if (node.table_id) {
              try {
                const tRes = await fetchTableById(node.table_id)
                const tNode = tRes?.data?.tables?.nodes?.[0]
                const name = tNode?.name ?? null
                if (!cancelled) setTableName(name)
              } catch {
                if (!cancelled) setTableName(null)
              }
            } else {
              setTableName(null)
            }
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load endpoint')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [endpointId])

  function buildScriptDefs(): { pre_script?: EndpointScriptDef; post_script?: EndpointScriptDef } {
    const pre_script: EndpointScriptDef = {
      kind: 'pre',
      lang: 'js',
      enabled: preEnabled,
      script_timeout_ms: preTimeout || 0,
      code: preCode || '',
    }

    const post_script: EndpointScriptDef = {
      kind: 'post',
      lang: 'js',
      enabled: postEnabled,
      script_timeout_ms: postTimeout || 0,
      code: postCode || '',
    }

    return { pre_script, post_script }
  }

  async function onSaveScripts() {
    if (!endpointId) return
    try {
      setScriptSaved(true) // optimistic; will revert on failure
      await updateEndpoint(String(endpointId), buildScriptDefs())
      success?.('Custom logic saved')
    } catch (e: any) {
      setScriptSaved(false)
      error?.(e?.message || 'Failed to save custom logic')
    }
  }

  async function onPreview() {
    setPreviewError(null)
    setPreviewResult(null)
    setPreviewing(true)
    try {
      let request: ScriptPreviewRequest['request']
      try {
        request = JSON.parse(sampleRequest)
      } catch {
        throw new Error('Sample Request is not valid JSON.')
      }

      const payload: ScriptPreviewRequest = {
        kind: previewKind,
        lang: 'js',
        timeout_ms: previewKind === 'pre' ? preTimeout : postTimeout,
        code: previewKind === 'pre' ? preCode : postCode,
        request,
      }
      const res = await previewEndpointScript(payload)
      setPreviewResult(res.data)
      success?.('Script preview executed')
    } catch (e: any) {
      setPreviewError(e?.message || 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }


  const onCopyUrl = async () => {
    if (!ep?.url) return
    const ok = await copyToClipboard(ep.url)
    if (ok) {
      setCopied(true)
      success?.('Copied endpoint URL')
      setTimeout(() => setCopied(false), 1500)
    } else {
      error?.('Failed to copy')
    }
  }

  const handleDelete = async (endpoint: Endpoint) => {
    console.log("endpointId; ", endpointId)
    if (!endpointId) return
    try {
      setDeleting(true)
      await deleteEndpoint(String(endpointId))
      success?.(`${endpoint.name || 'Endpoint'} deleted`)
      setConfirmEp(null)
      navigate(`/applications/${appId}/endpoints`)
    } catch (e) {
      error?.(e instanceof Error ? e.message : 'Failed to delete endpoint')
    } finally {
      setDeleting(false)
    }
  }

  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      className={`px-2 py-3 text-sm font-semibold border-b-2 ${activeTab === id
        ? 'border-[#ea2a33] text-[#ea2a33]'
        : 'border-transparent text-[#4d4d4d] hover:text-[#1a1a1a]'
        }`}
      onClick={() => setActiveTab(id)}
    >
      {label}
    </button>
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (loadError || !ep) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="text-sm text-red-700">{loadError || 'Endpoint not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        {/* Breadcrumb */}
        {/* <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                to={`/applications/${appId}/endpoints`}
                className="text-[#6b7280] hover:text-[#111827] hover:underline"
              >
                Endpoints
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#9ca3af]">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                <path d="M96.97,215.03a8,8,0,0,1-5.66-13.66L148.69,144,91.31,86.63A8,8,0,0,1,102.63,75.3l64,64a8,8,0,0,1,0,11.32l-64,64A8,8,0,0,1,96.97,215.03Z" />
              </svg>
            </li>
            <li className="font-semibold text-[#111827] truncate max-w-[60vw]" title={ep.name}>
              {ep.name}
            </li>
          </ol>
        </nav> */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#111827] mr-3"
        >
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,128a8,8,0,0,1-8,8H69.66l34.17,34.17a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48a8,8,0,1,1,11.32,11.32L69.66,120H216A8,8,0,0,1,224,128Z" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-[#1a1a1a]">Endpoint Details</h1>
        <p className="text-sm text-[#4d4d4d] mt-1">
          View and manage your endpoint details, custom logic, and logs.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">

          {/* <button
            className="px-4 py-2 text-sm font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5 disabled:opacity-50"
          >
            View Requests
          </button> */}
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded bg-[#ec1313] text-white hover:bg-[#ec1313]/90"
          >
            Edit Endpoint
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (ep) setConfirmEp(ep)
            }}
            className="px-4 py-2 text-sm font-medium rounded text-[#ec1313] hover:bg-[#ec1313]/10"
          >
            Delete Endpoint
          </button>
        </div>
      </div>

      <div className="border-b border-black/10 ">
        <nav className="flex gap-6">
          <Tab id="general" label="General" />
          <Tab id="custom" label="Custom Logic" />
          <Tab id="security" label="Security" />
          <Tab id="logs" label="Logs" />
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-black/5 p-6">
              <h3 className="text-lg font-bold text-[#111827]">Endpoint Information</h3>

              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <Info label="Name" value={ep.name || '—'} />
                <Info label="Method" value={(ep.method || 'GET').toUpperCase()} />

                <div className="sm:col-span-2">
                  <span className="text-[#6b7280]">URL</span>
                  <div className="mt-1 flex items-center justify-between bg-black/5 dark:bg-white/10 px-3 py-2 rounded">
                    <span className="truncate font-mono text-[#1a1a1a]">{ep.url || '—'}</span>
                    {!!ep.url && (
                      <button
                        type="button"
                        onClick={onCopyUrl}
                        aria-label={copied ? 'Copied' : 'Copy endpoint URL'}
                        title={copied ? 'Copied!' : 'Copy URL'}
                        className="p-1.5 rounded-md hover:bg-gray-200 relative text-[#111827]"
                      >
                        {copied ? (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-green-600">
                            <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
                          </svg>
                        ) : (
                          <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18" className="opacity-80">
                            <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path>
                          </svg>
                        )}
                        {copied && (
                          <span className="absolute -top-7 right-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                            Copied
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <Info label="Visibility" value={ep.is_public ? 'Public' : 'Private'} />
                <Info label="Limit" value={ep.limit_default != null ? String(ep.limit_default) : '—'} />
                <Info
                  label="Database"
                  value={
                    dbName ? (
                      <Link
                        to={`/applications/${appId || ep.application_id}/databases/${ep.database_id}`}
                        className="font-medium text-[#ec1313] hover:underline"
                      >
                        {dbName}
                      </Link>
                    ) : (
                      ep.database_id || '—'
                    )
                  }
                />
                <Info label="Table" value={tableName || ep.table_id || '—'} />                <Info label="Order By" value={ep.order_by || '—'} />
                <Info label="Order Direction" value={ep.order_direction || '—'} />
                <Info label="Created" value={new Date(ep.created_at).toLocaleString()} />
                <Info label="Updated" value={new Date(ep.updated_at).toLocaleString()} />
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2">Query</h4>
                <pre className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 font-mono overflow-x-auto">
                  {ep.query_template || '-- No SQL defined for this endpoint.'}
                </pre>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2">Selected Columns</h4>
                {Array.isArray(ep.columns) && ep.columns.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ep.columns.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-gray-50 font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6b7280]">—</p>
                )}
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-2">Additional Settings</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <Info label="Version" value={ep.version || '—'} />
                  <Info label="Path" value={ep.path || '—'} />
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#6b7280] text-sm">Path Params Schema</span>
                    <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-xs text-gray-800 font-mono overflow-x-auto">
                      {ep.param_schema ? JSON.stringify(ep.param_schema, null, 2) : '—'}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[#6b7280] text-sm">Query Schema</span>
                    <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-xs text-gray-800 font-mono overflow-x-auto">
                      {ep.query_schema ? JSON.stringify(ep.query_schema, null, 2) : '—'}
                    </pre>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#6b7280] text-sm">Body Schema</span>
                    <pre className="mt-1 bg-gray-50 rounded-lg p-3 text-xs text-gray-800 font-mono overflow-x-auto">
                      {ep.body_schema ? JSON.stringify(ep.body_schema, null, 2) : '—'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm border border-black/5 p-6">
            {/* <h3 className="text-lg font-bold text-[#111827]">Security</h3>
            <div className="mt-4 text-sm text-[#4d4d4d] space-y-3">
              <p><span className="font-medium text-[#111827]">Visibility:</span> {ep.is_public ? 'Public' : 'Private'}</p>
              <p>Configure auth, rate limiting, and access rules for this endpoint (UI stub).</p>
            </div> */}
            <p>More security options coming soon...</p>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm border border-black/5">
                <div className="p-4 border-b border-black/10 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111827]">Custom Logic</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm inline-flex items-center gap-1.5 ${scriptSaved ? 'text-green-600' : 'text-amber-600'}`}>
                      {scriptSaved ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 15l-5-5 1.41-1.42L11 14.17l6.59-6.58L19 9l-8 8z" /></svg>
                          Saved
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM11 6h2v7h-2V6zm0 9h2v2h-2v-2z" /></svg>
                          Unsaved changes
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                      onClick={onSaveScripts}
                      title="Save Scripts"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10l4-4V5a2 2 0 00-2-2h-2zm-2 2v4H9V5h6zM7 21V11h10v6h-4a1 1 0 00-1 1v3H7z" /></svg>
                      Save
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  <section className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-md font-semibold text-[#111827]">Pre (Before Request)</h4>
                        <DocTooltip
                          title="Pre-Request Script"
                          align="left"
                          widthClass="w-[28rem]"
                          content={`🧩 Pre-Request Script

Runs before your endpoint’s SQL query executes.
You can use it to validate, modify, or block the request dynamically.

Available variables:
• req.headers → Incoming request headers
• req.pathParams → Route parameters (e.g. /users/:id)
• req.query → Query parameters (e.g. ?limit=10)
• req.body → Parsed JSON body
• env → Context info { version, appSlug, now(), uuid() }

Special functions:
• abort(message, status?) → Stop execution and return an error
• mutate({ body, query, pathParams, headers }) → Modify incoming data

Example:

if (!req.body || !req.body.user_id) {
  abort("Missing required field: user_id", 400);
}

mutate({
  headers: { "x-validated": "true" },
  body: { ...req.body, created_at: env.now() }
});`}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={preEnabled}
                            onChange={(e) => { setPreEnabled(e.target.checked); setScriptSaved(false) }}
                          />
                          Enabled
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          Timeout (ms)
                          <input
                            type="number"
                            min={0}
                            className="w-24 px-2 py-1 border border-black/10 rounded"
                            value={preTimeout}
                            onChange={(e) => { setPreTimeout(Number(e.target.value || 0)); setScriptSaved(false) }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-3 font-mono text-[#e2e8f0] text-sm overflow-x-auto">
                      <CodeEditor
                        id="pre-script"
                        aria-label="Pre script"
                        value={preCode}
                        onChange={(v) => { setPreCode(v); setScriptSaved(false) }}
                        minRows={5}
                        className="w-full"
                      />
                    </div>
                  </section>

                  <section className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-md font-semibold text-[#111827]">Post (Before Response)</h4>
                        <DocTooltip
                          title="Post-Request Script"
                          align="left"
                          widthClass="w-[28rem]"
                          content={`🚀 Post-Request Script
Runs after your endpoint’s SQL query or fetch.
You can use it to modify the response or trigger side effects (like logging or webhooks).

Available variables:
• res.status → Response status code
• res.body → Query result or response data
• req → Original request object
• env → Context info { version, appSlug, now(), uuid() }

Example:

if (res.status === 200 && Array.isArray(res.body)) {
  mutate({
    body: res.body.map(r => ({ ...r, inspected: true }))
  });
}

✅ Tip:
Use Pre-Request scripts for validation or transformation, and Post-Request scripts for enrichment or cleanup.`}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={postEnabled}
                            onChange={(e) => { setPostEnabled(e.target.checked); setScriptSaved(false) }}
                          />
                          Enabled
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          Timeout (ms)
                          <input
                            type="number"
                            min={0}
                            className="w-24 px-2 py-1 border border-black/10 rounded"
                            value={postTimeout}
                            onChange={(e) => { setPostTimeout(Number(e.target.value || 0)); setScriptSaved(false) }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="bg-[#0f172a] rounded-lg p-3 font-mono text-[#e2e8f0] text-sm overflow-x-auto">
                      <CodeEditor
                        id="post-script"
                        aria-label="Post script"
                        value={postCode}
                        onChange={(v) => { setPostCode(v); setScriptSaved(false) }}
                        minRows={5}
                        className="w-full"
                      />
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Right column: testing/preview + versions (blurred) */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {/* Testing/Preview Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-black/5">
                <div className="p-4 border-b border-black/10 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111827]">Preview Script</h3>
                  <div className="inline-flex rounded-md border border-black/10 overflow-hidden">
                    <button
                      className={`px-3 py-1.5 text-sm ${previewKind === 'pre' ? 'bg-[#ec1313] text-white' : 'text-[#111827]'}`}
                      onClick={() => setPreviewKind('pre')}
                    >
                      Pre
                    </button>
                    <button
                      className={`px-3 py-1.5 text-sm ${previewKind === 'post' ? 'bg-[#ec1313] text-white' : 'text-[#111827]'}`}
                      onClick={() => setPreviewKind('post')}
                    >
                      Post
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-[#4d4d4d] mb-2">Sample Request (JSON)</label>
                  <textarea
                    className="w-full p-2 border border-black/10 rounded-md text-sm font-mono focus:ring-[#ec1313] focus:border-[#ec1313]"
                    rows={8}
                    value={sampleRequest}
                    onChange={(e) => setSampleRequest(e.target.value)}
                  />
                  <button
                    type="button"
                    className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-[#ec1313] text-white hover:bg-[#ec1313]/90 disabled:opacity-50"
                    onClick={onPreview}
                    disabled={previewing}
                  >
                    {previewing ? 'Running…' : 'Run Preview'}
                  </button>

                  {previewError && (
                    <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      {previewError}
                    </div>
                  )}

                  {previewResult && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-xs text-[#6b7280] mb-1">Status</div>
                        <div className="px-2 py-1 bg-gray-50 rounded border border-gray-200 text-sm">
                          {previewResult.status} • {previewResult.message}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-[#6b7280] mb-1">Abort</div>
                        <pre className="bg-gray-50 rounded p-2 text-xs border border-gray-200 overflow-x-auto">
                          {JSON.stringify(previewResult.data?.abort ?? null, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <div className="text-xs text-[#6b7280] mb-1">Mutations</div>
                        <pre className="bg-gray-50 rounded p-2 text-xs border border-gray-200 overflow-x-auto">
                          {JSON.stringify(previewResult.data?.mutate ?? null, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Versions (blurred / coming soon) */}
              <div className="relative opacity-50 pointer-events-none select-none">
                <div className="absolute right-3 top-3 z-10 text-xs bg-black/80 text-white px-2 py-0.5 rounded">
                  Coming soon
                </div>
                {/* keep your existing Versions card unchanged below */}
                <div className="bg-white rounded-lg shadow-sm border border-black/5">
                  <div className="p-4 border-b border-black/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#111827]">Versions</h3>
                    <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded">
                      v1.2.0 Published
                    </span>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center p-2 rounded-md bg-green-50 border border-green-200">
                        <div>
                          <p className="font-semibold">
                            v1.2.0 <span className="text-xs text-green-700">(Published)</span>
                          </p>
                          <p className="text-xs text-gray-500">Published by Alex on 2023-10-27</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="View"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M12 6C5 6 1 12 1 12s4 6 11 6 11-6 11-6-4-6-11-6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                          </button>
                        </div>
                      </li>

                      <li className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                        <div>
                          <p className="font-semibold">v1.1.0</p>
                          <p className="text-xs text-gray-500">Saved by Alex on 2023-10-26</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="View"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M12 6C5 6 1 12 1 12s4 6 11 6 11-6 11-6-4-6-11-6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                          </button>

                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="History"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <polyline points="3 6 3 12 9 12" />
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 3" />
                            </svg>
                          </button>

                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="Publish"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M5 4h14v2H5V4zM7 9h10v7h3l-8 7-8-7h3V9z" />
                            </svg>
                          </button>
                        </div>
                      </li>

                      <li className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                        <div>
                          <p className="font-semibold">v1.0.0</p>
                          <p className="text-xs text-gray-500">Saved by Jane on 2023-10-25</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="View"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M12 6C5 6 1 12 1 12s4 6 11 6 11-6 11-6-4-6-11-6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                          </button>

                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="History"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <polyline points="3 6 3 12 9 12" />
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 3" />
                            </svg>
                          </button>

                          <button
                            className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded border border-black/10 text-[#111827] hover:bg-black/5"
                            title="Publish"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M5 4h14v2H5V4zM7 9h10v7h3l-8 7-8-7h3V9z" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        {confirmEp &&
          createPortal(
            <div className="fixed inset-0 z-[10000]">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => !deleting && setConfirmEp(null)}
                aria-hidden="true"
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-[#1a1a1a]">Delete endpoint</h3>
                    <p className="mt-1 text-sm text-[#4d4d4d]">
                      Are you sure you want to delete{' '}
                      <span className="font-semibold text-[#1a1a1a]">{confirmEp.name || 'this endpoint'}</span>? This action cannot be undone.
                    </p>
                  </div>

                  <div className="px-6 py-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmEp(null)}
                      className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirmEp) handleDelete(confirmEp)
                      }}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#ea2a33] px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                          <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M216,56H168V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48v8H40a8,8,0,0,0,0,16H48V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V72h8a8,8,0,0,0,0-16ZM104,48h48v8H104Zm88,160H64V72H192Z" />
                        </svg>
                      )}
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        }

        {editOpen && ep && (
          <EndpointFormModal
            isOpen={editOpen}
            mode="edit"
            appId={appId || ep.application_id}
            databaseId={String(ep.database_id || '')}
            endpointId={String(ep.id)}
            initial={{
              name: ep.name ?? '',
              method: (ep.method?.toUpperCase?.() as EndpointMethod) || 'GET',
              table_id: ep.table_id ?? '',
              columns: Array.isArray((ep as any).columns) ? (ep as any).columns : [],
              is_public: !!ep.is_public,
              limit: ep.limit_default ?? 50,
              order_by: ep.order_by ?? 'id',
              order_direction: (ep.order_direction as OrderDirection) ?? 'ASC',
              database_id: ep.database_id ?? '',
              version: ep.version ?? 'v1',
              path: ep.path ?? '',
              param_schema: ep.param_schema,
              query_schema: ep.query_schema,
              body_schema: ep.body_schema,
              query_template: ep.query_template ?? '',
            }}
            onClose={() => setEditOpen(false)}
            onSaved={async () => {
              setEditOpen(false)
              await reloadEndpoint()
              success?.('Endpoint updated successfully')
            }}
          />
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-sm border border-black/5 p-6">
            {/* <h3 className="text-lg font-bold text-[#111827]">Logs</h3> */}
            <p className="mt-2 text-sm text-[#4d4d4d]">Requests and execution logs will appear here (Coming Soon...)</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#6b7280]">{label}</span>
      <span className="font-medium text-[#111827] break-all">{value}</span>
    </div>
  )
}



