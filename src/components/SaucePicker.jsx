// sauces: [{ id, name }] — selected is a sauce id
export default function SaucePicker({ sauces, selected, onSelect }) {
  if (sauces.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        No sauces available yet.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {sauces.map((sauce) => {
        const active = selected === sauce.id
        return (
          <button
            key={sauce.id}
            type="button"
            onClick={() => onSelect(sauce.id)}
            className="pill text-[11px] px-3 py-1.5 border"
            style={{
              borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: active ? 'var(--color-accent-soft)' : 'transparent',
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
            }}
          >
            {sauce.name}
          </button>
        )
      })}
    </div>
  )
}
