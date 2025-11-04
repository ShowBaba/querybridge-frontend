import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { createDatabase, testDatabaseConnection, updateDatabase } from '../api'

type Mode = 'create' | 'edit'

export type DatabasePayload = {
  name: string
  host: string
  port: number | string
  database: string
  username: string
  password: string
  db_engine: 'postgres' | 'mysql' | 'sqlite'
  ssl_mode: 'disable' | 'require' | 'verify-ca' | 'verify-full'
}

type Props = {
  isOpen: boolean
  mode: Mode
  appId?: string
  dbId?: string
  initial?: Partial<DatabasePayload>
  onClose: () => void
  onSaved?: () => void
}

const DEFAULTS: DatabasePayload = {
  name: '',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  db_engine: 'postgres',
  ssl_mode: 'disable',
}

export function DatabaseFormModal({
  isOpen,
  mode,
  appId,
  dbId,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [values, setValues] = useState<DatabasePayload>({ ...DEFAULTS })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'main' | 'ssh'>('main')

  const [testingConn, setTestingConn] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'checking' | 'up' | 'down' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState<string | null>(null)

  const [showTestModal, setShowTestModal] = useState(false)
  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setSaving(false)
    setTab('main')
    setValues({ ...DEFAULTS, ...initial })
  }, [isOpen, initial])

  const canSubmit = useMemo(() => {
    const { name, host, port, database, username, db_engine } = values
    return !!name && !!host && !!database && !!username && !!db_engine && String(port).trim() !== ''
  }, [values])

  const set = (patch: Partial<DatabasePayload>) =>
    setValues(v => ({ ...v, ...patch }))

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const payload = { ...values, port: Number(values.port) }

      if (mode === 'create' && appId) {
        await createDatabase(appId, payload)
      } else if (mode === 'edit' && dbId) {
        await updateDatabase(dbId, payload)
      }

      onClose()
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    if (!canSubmit) {
      setError('Please fill all required fields before testing.')
      return
    }
    try {
      setError(null)
      setTestingConn(true)
      setTestState('checking')
      setTestMessage(null)
      setShowTestModal(true)       

      const ok = await testDatabaseConnection({
        host: values.host,
        port: Number(values.port),
        database: values.database,
        username: values.username,
        password: values.password,
        db_engine: values.db_engine,
        ssl_mode: values.ssl_mode,
      })

      if (ok) {
        setTestState('up')
        setTestMessage('Connection successful.')
      } else {
        setTestState('down')
        setTestMessage('Database unreachable with the provided settings.')
      }
    } catch (e) {
      setTestState('error')
      const msg = e instanceof Error ? e.message : 'Test connection failed'
      setTestMessage(msg)
      setError(msg)
    } finally {
      setTestingConn(false)
    }
  }
  if (!isOpen) return null

  if (!isOpen) return null

  return (
    <>
      {createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-[10000]"
          onClick={() => !saving && onClose()}
          aria-modal
          role="dialog"
        >
          <div
            className="
            w-full max-w-2xl
            max-h-[90vh] min-h-0
            bg-white rounded-xl shadow-xl
            flex flex-col
            overflow-hidden
          "
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== Header ===== */}
            <header className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#111827]">
                {mode === 'create' ? 'Create Database' : 'Edit Database'}
              </h2>
              <button
                onClick={() => !saving && onClose()}
                className="text-gray-400 hover:text-[#111827]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            {/* ===== Body ===== */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="db-engine">
                    Database Engine
                  </label>
                  <select
                    id="db-engine"
                    value={values.db_engine}
                    onChange={(e) =>
                      set({ db_engine: e.target.value as DatabasePayload['db_engine'] })
                    }
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="name">
                    Custom DB Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g., My Production DB"
                    value={values.name}
                    onChange={(e) => set({ name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                  />
                </div>
              </div>

              <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                  <button
                    className={`px-1 pb-4 text-sm ${tab === 'main'
                        ? 'border-b-2 border-[#ea2a33] font-semibold text-[#ea2a33]'
                        : 'border-b-2 border-transparent text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                      }`}
                    onClick={() => setTab('main')}
                  >
                    Main
                  </button>
                  <button
                    className={`px-1 pb-4 text-sm ${tab === 'ssh'
                        ? 'border-b-2 border-[#ea2a33] font-semibold text-[#ea2a33]'
                        : 'border-b-2 border-transparent text-[#4d4d4d] hover:border-gray-300 hover:text-[#1a1a1a]'
                      }`}
                    onClick={() => setTab('ssh')}
                  >
                    SSH
                  </button>
                </nav>
              </div>

              {tab === 'main' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]" htmlFor="host">
                      Host
                    </label>
                    <input
                      id="host"
                      type="text"
                      value={values.host}
                      onChange={(e) => set({ host: e.target.value })}
                      placeholder="db.querybridge.com"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="port">
                        Port
                      </label>
                      <input
                        id="port"
                        type="number"
                        value={values.port}
                        onChange={(e) => set({ port: e.target.value })}
                        placeholder="5432"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="database">
                        Database
                      </label>
                      <input
                        id="database"
                        type="text"
                        value={values.database}
                        onChange={(e) => set({ database: e.target.value })}
                        placeholder="production_db"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="username">
                        Username
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={values.username}
                        onChange={(e) => set({ username: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="password">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={values.password}
                        onChange={(e) => set({ password: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg placeholder:text-[#9ca3af] text-[#111827] focus:ring-2 focus:ring-[#ec1313]/50 focus:border-[#ec1313]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#111827]">SSL Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {(['disable', 'require', 'verify-ca', 'verify-full'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set({ ssl_mode: opt })}
                          className={`px-3 py-1.5 rounded-md border text-sm transition ${values.ssl_mode === opt
                              ? 'border-[#ec1313] ring-1 ring-[#ec1313] text-[#ec1313] bg-[#ec1313]/10'
                              : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={testConnection}
                      type="button"
                      disabled={testingConn}
                      className="w-full justify-center rounded-lg bg-[#ec1313]/10 px-4 py-2 text-sm font-semibold text-[#ec1313] hover:bg-[#ec1313]/20 focus:outline-none focus:ring-2 focus:ring-[#ec1313] disabled:opacity-50"
                    >
                      {testingConn ? 'Testing…' : 'Test Connection'}
                    </button>
                  </div>
                </div>
              )}

              {tab === 'ssh' && (
                <div className="text-sm text-[#4d4d4d]">SSH options coming soon</div>
              )}
            </main>

            {/* ===== Footer ===== */}
            <footer className="flex-shrink-0 p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => !saving && onClose()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ec1313]"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={
                  !canSubmit || saving || (mode === 'create' && !appId) || (mode === 'edit' && !dbId)
                }
                className="rounded-lg bg-[#ec1313] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#ec1313]/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#ec1313]"
                type="button"
              >
                {saving
                  ? mode === 'create'
                    ? 'Creating…'
                    : 'Saving…'
                  : mode === 'create'
                    ? 'Create Database'
                    : 'Save Changes'}
              </button>
            </footer>
          </div>
        </div>,
        document.body
      )}

      {/* ===== Top-most Test Connection Modal ===== */}
      {showTestModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4"
            aria-modal
            role="dialog"
            onClick={() => !testingConn && setShowTestModal(false)}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-[#111827]">Connection Test</h3>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
                  onClick={() => !testingConn && setShowTestModal(false)}
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[#6b7280]">close</span>
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#6b7280]">Current status</div>
                  <StatusBadge state={testState} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div>
                    <span className="text-[#6b7280]">Host &amp; Port:</span>
                    <span className="ml-1 font-medium text-[#111827]">
                      {values.host}:{String(values.port).trim() || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6b7280]">Engine:</span>
                    <span className="ml-1 font-medium text-[#111827]">{values.db_engine}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280]">Database:</span>
                    <span className="ml-1 font-medium text-[#111827]">{values.database || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6b7280]">SSL Mode:</span>
                    <span className="ml-1 font-medium text-[#111827]">{values.ssl_mode}</span>
                  </div>
                </div>

                <div className="text-sm">
                  {testingConn ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      <span className="text-[#6b7280]">Testing connection…</span>
                    </div>
                  ) : (
                    <span className="font-medium text-[#111827]">
                      {testMessage ||
                        (testState === 'up' ? 'Connection successful.' : 'Test completed.')}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={testingConn}
                  onClick={() => setShowTestModal(false)}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConn}
                  className="px-3 py-1.5 rounded-md bg-[#ec1313] text-white text-sm font-semibold hover:bg-[#ec1313]/90 disabled:opacity-50"
                >
                  {testingConn ? 'Retesting…' : 'Retest'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

async function safeError(res: Response) {
  try {
    const data = await res.json()
    return data?.message || JSON.stringify(data)
  } catch {
    return res.statusText
  }
}

function StatusBadge({ state }: { state: 'idle' | 'checking' | 'up' | 'down' | 'error' }) {
  if (state === 'checking') {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />
      </span>
    )
  }
  if (state === 'up') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-50 text-green-700 border border-green-200 px-2 py-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" /></svg>
        Connected
      </span>
    )
  }
  if (state === 'down') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.586l4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95 1.414-1.414z" /></svg>
        Unreachable
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
      Error
    </span>
  )
}