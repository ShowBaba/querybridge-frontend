import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

export function AppShell() {
  const location = useLocation()
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({
    dashboard: null,
    applications: null,
    databases: null,
    endpoints: null,
    settings: null,
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({ opacity: 0 })

  useEffect(() => {
    const path = location.pathname
    const key =
      path.startsWith('/applications') ? 'applications' :
        path.startsWith('/databases') ? 'databases' :
          path.startsWith('/endpoints') ? 'endpoints' :
            path.startsWith('/settings') ? 'settings' :
              'dashboard'

    const frame = requestAnimationFrame(() => {
      const el = itemRefs.current[key]
      const container = containerRef.current
      if (!el || !container) return

      const cRect = container.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const top = r.top - cRect.top + container.scrollTop

      setPillStyle({
        top,
        height: r.height,
        left: 8,
        right: 8,
        borderRadius: 8,
        position: 'absolute',
        background: '#fef0f0',
        opacity: 1,
        transition: 'top 220ms cubic-bezier(.2,.8,.2,1), height 220ms, opacity 120ms',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [location.pathname])

  const baseItem =
    'relative z-10 flex items-center gap-3 px-4 py-3 rounded-lg transition-colors'
  const inactive =
    'text-[#4d4d4d] hover:bg-gray-100 hover:text-[#1a1a1a]'
  const active =
    'text-[#1a1a1a] font-semibold'

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${baseItem} ${isActive ? active : inactive}`

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">QueryBridge</h1>
          </div>
        </div>

        <nav ref={containerRef} className="relative mt-6 px-4">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2"
            style={pillStyle}
          />

          <NavLink
            to="/dashboard"
            ref={(el) => (itemRefs.current.dashboard = el)}
            className={navClass}
            end
          >
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z"></path>
            </svg>
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/applications"
            ref={(el) => (itemRefs.current.applications = el)}
            className={navClass}
          >
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM68,96A12,12,0,1,1,80,84,12,12,0,0,1,68,96Zm40,0a12,12,0,1,1,12-12A12,12,0,0,1,108,96Z"></path>
            </svg>
            <span className="font-medium">Applications</span>
          </NavLink>

          <NavLink
            to="/databases"
            ref={(el) => (itemRefs.current.databases = el)}
            className={navClass}
          >
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M128,24C74.17,24,32,48.6,32,80v96c0,31.4,42.17,56,96,56s96-24.6,96-56V80C224,48.6,181.83,24,128,24Zm80,104c0,9.62-7.88,19.43-21.61,26.92C170.93,163.35,150.19,168,128,168s-42.93-4.65-58.39-13.08C55.88,147.43,48,137.62,48,128V111.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64ZM69.61,53.08C85.07,44.65,105.81,40,128,40s42.93,4.65,58.39,13.08C200.12,60.57,208,70.38,208,80s-7.88,19.43-21.61,26.92C170.93,115.35,150.19,120,128,120s-42.93-4.65-58.39-13.08C55.88,99.43,48,89.62,48,80S55.88,60.57,69.61,53.08ZM186.39,202.92C170.93,211.35,150.19,216,128,216s-42.93-4.65-58.39-13.08C55.88,195.43,48,185.62,48,176V159.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64V176C208,185.62,200.12,195.43,186.39,202.92Z"></path>
            </svg>
            <span className="font-medium">Databases</span>
          </NavLink>

          <NavLink
            to="/endpoints"
            ref={(el) => (itemRefs.current.endpoints = el)}
            className={navClass}
          >
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"></path>
            </svg>
            <span className="font-medium">Endpoints</span>
          </NavLink>

          <NavLink
            to="/settings"
            ref={(el) => (itemRefs.current.settings = el)}
            className={navClass}
          >
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24">
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Z"></path>
            </svg>
            <span className="font-medium">Settings</span>
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
