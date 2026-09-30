const OPTIONS = [
  { key: 'milk', label: 'Milk', delta: 3000 },
  { key: 'chocolate', label: 'Chocolate', delta: 1000 },
  { key: 'foamy', label: 'Foamy', delta: 0 },
    { key: 'condensedMilk', label: 'Condensed Milk', delta: 2000 },
]

export default function CoffeeOptions({ values, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map(({ key, label, delta }) => {
        const active = !!values[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className="pill text-[11px] px-3 py-1.5 border"
            style={{
              borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: active ? 'var(--color-accent-soft)' : 'transparent',
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
            }}
          >
            {label}
            {delta > 0 ? ` +${delta / 1000}k` : ''}
          </button>
        )
      })}
    </div>
  )
}
