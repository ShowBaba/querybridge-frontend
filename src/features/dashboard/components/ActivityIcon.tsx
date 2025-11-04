export const ActivityIcon = ({
  severity,
  type,
}: {
  severity?: 'warning' | 'error' | 'success' | null
  type?: string | null
}) => {
  if (severity === 'warning') {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
        <span className="material-symbols-outlined">warning</span>
      </div>
    )
  }
  if (severity === 'error') {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        <span className="material-symbols-outlined">error</span>
      </div>
    )
  }
  if (severity === 'success') {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
    )
  }

  const mapTypeToIcon = (t?: string | null): { icon: string; cls: string } => {
    if (!t) return { icon: 'apps', cls: 'bg-[#ec1313]/10 text-[#ec1313]' }

    const groups: Array<[RegExp, { icon: string; cls: string }]> = [
      [/^auth\.login\.success$|^LOGIN_SUCCESS$/i, { icon: 'lock_open', cls: 'bg-green-100 text-green-600' }],
      [/^auth\./i, { icon: 'lock', cls: 'bg-gray-100 text-gray-600' }],

      [/^application\.create$/i, { icon: 'add_circle', cls: 'bg-blue-100 text-blue-600' }],
      [/^application\.update$/i, { icon: 'edit', cls: 'bg-indigo-100 text-indigo-600' }],

      [/^database\.create$/i, { icon: 'database', cls: 'bg-purple-100 text-purple-600' }],
      [/^database\.update$/i, { icon: 'database', cls: 'bg-purple-100 text-purple-600' }],

      [/^endpoint\.create$|^create$/i, { icon: 'link', cls: 'bg-teal-100 text-teal-600' }],
      [/^endpoint\.delete$|^delete$/i, { icon: 'link_off', cls: 'bg-rose-100 text-rose-600' }],

      [/^deploy|release/i, { icon: 'rocket_launch', cls: 'bg-sky-100 text-sky-600' }],
      [/^error|fail/i, { icon: 'error', cls: 'bg-red-100 text-red-600' }],
      [/^warn/i, { icon: 'warning', cls: 'bg-yellow-100 text-yellow-600' }],
      [/^info|event|activity/i, { icon: 'info', cls: 'bg-gray-100 text-gray-600' }],
    ]

    for (const [re, v] of groups) if (re.test(t)) return v
    return { icon: 'apps', cls: 'bg-[#ec1313]/10 text-[#ec1313]' }
  }

  const { icon, cls } = mapTypeToIcon(type)
  return (
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${cls}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  )
}