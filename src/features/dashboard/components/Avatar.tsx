export const Avatar: React.FC<{ name: string; src?: string | null }> = ({ name, src }) => {
  const initials = (name || 'U')
    .split(' ')
    .map((n) => n.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-9 w-9 rounded-full object-cover border border-gray-200"
      />
    )
  }

  return (
    <div className="h-9 w-9 rounded-full bg-gray-200 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
      {initials}
    </div>
  )
}