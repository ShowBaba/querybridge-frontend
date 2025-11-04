export function Toggle({
  value,             
  onChange,
  label = 'Endpoint visibility',
  hint,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
  hint?: string
}) {
  const base =
    "px-3 py-1.5 rounded-md border text-sm font-medium transition";
  const active =
    "border-[#ec1313] ring-1 ring-[#ec1313] text-[#ec1313] bg-[#ec1313]/10";
  const inactive = "border-gray-300 hover:bg-gray-50 text-[#111827]";

  return (
    <div className="flex items-center justify-between gap-4">
      <div role="radiogroup" aria-label={label} className="inline-flex gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          onClick={() => onChange(false)}
          className={`${base} ${!value ? active : inactive}`}
        >
          Private
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value}
          onClick={() => onChange(true)}
          className={`${base} ${value ? active : inactive}`}
        >
          Public
        </button>
      </div>

      {hint && (
        <span className="text-sm text-[#6b7280] whitespace-nowrap">
          {hint}
        </span>
      )}
    </div>
  );
}