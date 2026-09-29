import { Pencil } from 'lucide-react'

export default function ItemCard({
  tag,
  title,
  price,
  icon: Icon,
  tileColor = 'var(--color-accent)',
  image,
  outOfStock,
  stockLeft,
  onAdd,
  onEdit,
  disabled,
  added,
  children,
}) {
  const isDisabled = disabled || outOfStock

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-32 flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: tileColor }}>
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          Icon && <Icon size={36} color="#fff" strokeWidth={1.5} />
        )}
        {outOfStock && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            <span
              className="text-[11px] font-medium text-white pill px-3 py-1"
              style={{ border: '1px solid #fff' }}
            >
              Out of Stock
            </span>
          </div>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p
            className="text-[11px] font-medium tracking-wide uppercase"
            style={{ color: 'var(--color-accent)' }}
          >
            {tag}
          </p>
          <h3 className="text-[15px] font-medium mt-0.5">{title}</h3>
          {typeof stockLeft === 'number' && stockLeft > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {stockLeft} Left
            </p>
          )}
        </div>

        {children}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Rp {price.toLocaleString('id-ID')}</span>
          <button
            type="button"
            onClick={onAdd}
            disabled={isDisabled}
            className={added ? 'btn-outline text-xs px-4 py-2' : 'btn-primary text-xs px-4 py-2'}
            style={isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            {outOfStock ? 'Out of stock' : added ? 'Added' : 'Add to order'}
          </button>
        </div>
      </div>
    </div>
  )
}
