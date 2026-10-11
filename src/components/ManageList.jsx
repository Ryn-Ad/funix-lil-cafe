import { Pencil, X } from 'lucide-react'

// A compact list of sauces / options with edit and delete buttons.
export default function ManageList({ title, entries, onEdit, onDelete, children }) {
  return (
    <div className="card p-4 mt-4">
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-muted)' }}>
        {title} ({entries.length})
      </p>
      {entries.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            none yet.
          </p>
          {children}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => (
            <span
              key={entry.id}
              className="pill border text-xs pl-3 pr-2 py-1.5 flex items-center gap-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {entry.label}
              {entry.detail && <span style={{ color: 'var(--color-muted)' }}>{entry.detail}</span>}
              <button onClick={() => onEdit(entry)} aria-label={`Edit ${entry.label}`} style={{ color: 'var(--color-muted)' }}>
                <Pencil size={12} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${entry.label}"?`)) onDelete(entry.id)
                }}
                aria-label={`Delete ${entry.label}`}
                style={{ color: 'var(--color-muted)' }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
