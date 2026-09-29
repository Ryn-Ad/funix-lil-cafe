import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-20 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ color: 'var(--color-muted)' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
