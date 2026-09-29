import { Plus } from 'lucide-react'

export default function AddItemCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="card flex flex-col items-center justify-center gap-2 min-h-[220px] text-sm"
      style={{ border: '1px dashed var(--color-border)', color: 'var(--color-muted)' }}
    >
      <Plus size={20} />
      Add Item
    </button>
  )
}
