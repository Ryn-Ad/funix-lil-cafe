export default function SaucePicker({ sauces, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sauces.map((sauce) => {
        const active = selected === sauce
        return (
          <button
            key={sauce}
            type="button"
            onClick={() => onSelect(sauce)}
            className="pill text-[11px] px-3 py-1.5 border"
            style={{
              borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: active ? 'var(--color-accent-soft)' : 'transparent',
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
            }}
          >
            {sauce}
          </button>
        )
      })}
    </div>
  )
}
