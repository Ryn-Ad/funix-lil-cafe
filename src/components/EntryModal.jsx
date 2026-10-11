import { useEffect, useState } from 'react'
import Modal from './Modal'

// One small add/edit dialog for sauces (name only) and coffee options
// (name + the price added to the drink).
export default function EntryModal({ open, onClose, onSubmit, title, withPrice, initialValue }) {
  const isEdit = !!initialValue
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initialValue?.name || '')
      setPrice(initialValue?.price == null ? '' : String(initialValue.price))
      setError('')
    }
  }, [open, initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Give it a name')
    if (withPrice && (price === '' || Number(price) < 0)) return setError('Enter a price (0 if free)')
    onSubmit(withPrice ? { name: name.trim(), price: Number(price) } : { name: name.trim() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'edit' : 'add'} ${title}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-field px-3 py-2 text-sm"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {withPrice && (
          <input
            className="input-field px-3 py-2 text-sm"
            type="number"
            placeholder="extra price (Rp)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        )}
        {error && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary py-2.5 text-sm mt-1">
          {isEdit ? 'save changes' : `add ${title}`}
        </button>
      </form>
    </Modal>
  )
}
