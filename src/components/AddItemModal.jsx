import { useState, useEffect } from 'react'
import Modal from './Modal'

const emptySauces = ['', '', '']

function fieldsFrom(initialValue, itemType) {
  return {
    name: initialValue?.name || '',
    price: initialValue ? String(initialValue.price) : '',
    stock: initialValue?.stock == null ? '' : String(initialValue.stock),
    image: initialValue?.image || '',
    category: initialValue?.category || (itemType === 'salad' ? 'salad' : 'coffee'),
    hasOptions: initialValue ? !!initialValue.hasOptions : itemType === 'coffee',
    sauces: initialValue?.sauces || emptySauces,
  }
}

export default function AddItemModal({ open, onClose, onSubmit, itemType, initialValue }) {
  const isEdit = !!initialValue
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState('salad')
  const [hasOptions, setHasOptions] = useState(false)
  const [sauces, setSauces] = useState(emptySauces)
  const [error, setError] = useState('')

  // Re-populate the form every time the modal opens — with the item
  // being edited, or blank defaults for a new one.
  useEffect(() => {
    if (open) {
      const f = fieldsFrom(initialValue, itemType)
      setName(f.name)
      setPrice(f.price)
      setStock(f.stock)
      setImage(f.image)
      setCategory(f.category)
      setHasOptions(f.hasOptions)
      setSauces(f.sauces)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValue, itemType])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !price) {
      setError('Name and price are required')
      return
    }
    if (itemType === 'salad' && category === 'salad' && sauces.some((s) => !s.trim())) {
      setError('Fill in all 3 sauce options, or switch category to snack')
      return
    }

    const base = {
      name: name.trim(),
      price: Number(price),
      stock: stock === '' ? null : Number(stock),
      image: image.trim() || null,
      category,
    }

    if (itemType === 'salad') {
      onSubmit({ ...base, sauces: category === 'salad' ? sauces.map((s) => s.trim()) : null })
    } else {
      onSubmit({ ...base, hasOptions })
    }

    onClose()
  }

  const noun = itemType === 'salad' ? 'salad item' : 'coffee item'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `edit ${noun}` : `add ${noun}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-field px-3 py-2 text-sm"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="input-field px-3 py-2 text-sm flex-1"
            type="number"
            placeholder="Price (Rp)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            className="input-field px-3 py-2 text-sm flex-1"
            type="number"
            placeholder="Stock (blank = unlimited)"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <select
          className="input-field px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {itemType === 'salad' ? (
            <>
              <option value="salad">Salad (Needs 3 sauce options)</option>
              <option value="snack">Snack (No sauces)</option>
            </>
          ) : (
            <>
              <option value="coffee">Coffee</option>
              <option value="non-coffee">Non-coffee</option>
            </>
          )}
        </select>

        {itemType === 'coffee' && (
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <input type="checkbox" checked={hasOptions} onChange={(e) => setHasOptions(e.target.checked)} />
            Has Milk / Chocolate / Foam options
          </label>
        )}

        {itemType === 'salad' && category === 'salad' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              3 Sauce options
            </p>
            {sauces.map((sauce, i) => (
              <input
                key={i}
                className="input-field px-3 py-2 text-sm"
                placeholder={`sauce ${i + 1}`}
                value={sauce}
                onChange={(e) => setSauces((s) => s.map((v, idx) => (idx === i ? e.target.value : v)))}
              />
            ))}
          </div>
        )}

        <input
          className="input-field px-3 py-2 text-sm"
          placeholder={`image path, e.g. /images/${itemType}/name.jpg (optional)`}
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        {error && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary py-2.5 text-sm mt-1">
          {isEdit ? 'Save Changes' : 'Add Item'}
        </button>
      </form>
    </Modal>
  )
}
