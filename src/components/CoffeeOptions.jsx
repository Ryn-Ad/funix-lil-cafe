function priceTag(price) {
  if (!price) return ''
  return price % 1000 === 0 ? ` +${price / 1000}k` : ` +${price.toLocaleString('id-ID')}`
}

export default function CoffeeOptions({ options, values, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, name, price }) => {
        const active = !!values[id]
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            className="pill text-[11px] px-3 py-1.5 border"
            style={{
              borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: active ? 'var(--color-accent-soft)' : 'transparent',
              color: active ? 'var(--color-accent)' : 'var(--color-muted)',
            }}
          >
            {name}
            {priceTag(price)}
          </button>
        )
      })}
    </div>
  )
}
