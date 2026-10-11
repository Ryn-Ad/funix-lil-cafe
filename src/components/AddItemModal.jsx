import { useState, useEffect } from 'react'
import Modal from './Modal'

function fieldsFrom(initialValue, itemType) {
  return {
    name: initialValue?.name || '',
    price: initialValue ? String(initialValue.price) : '',
    stock: initialValue?.stock == null ? '' : String(initialValue.stock),
    image: initialValue?.image || '',
    category: initialValue?.category || (itemType === 'salad' ? 'salad' : 'coffee'),
    hasOptions: initialValue ? !!initialValue.hasOptions : itemType === 'coffee',
  }
}

// Add/edit form for menu items. Sauces and coffee options are no longer
// typed in per item — they are shared lists managed with the "add sauce" /
// "add option" buttons on each corner page.
export default function AddItemModal({ open, onClose, onSubmit, itemType, initialValue }) {
  const isEdit = !!initialValue
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState('salad')
  const [hasOptions, setHasOptions] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const f = fieldsFrom(initialValue, itemType)
      setName(f.name)
      setPrice(f.price)
      setStock(f.stock)
      setImage(f.image)
      setCategory(f.category)
      setHasOptions(f.hasOptions)
      setError('')
    }
  }, [open, initialValue, itemType])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || price === '') {
      setError('Name and price are required')
      return
    }

    const base = {
      name: name.trim(),
      price: Number(price),
      stock: stock === '' ? null : Number(stock),
      image: image.trim() || null,
      category,
    }
    onSubmit(itemType === 'salad' ? base : { ...base, hasOptions })
    onClose()
  }

  const noun = itemType === 'salad' ? 'salad item' : 'coffee item'

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `edit ${noun}` : `add ${noun}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-field px-3 py-2 text-sm"
          placeholder="item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className="input-field px-3 py-2 text-sm flex-1"
            type="number"
            placeholder="price (Rp)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            className="input-field px-3 py-2 text-sm flex-1"
            type="number"
            placeholder="stock (blank = unlimited)"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <select className="input-field px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {itemType === 'salad' ? (
            <>
              <option value="salad">salad (customer picks a sauce)</option>
              <option value="snack">snack (no sauce)</option>
            </>
          ) : (
            <>
              <option value="coffee">coffee</option>
              <option value="non-coffee">non-coffee</option>
            </>
          )}
        </select>

        {itemType === 'coffee' && (
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <input type="checkbox" checked={hasOptions} onChange={(e) => setHasOptions(e.target.checked)} />
            customers can add options (milk, chocolate, ...)
          </label>
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
          {isEdit ? 'save changes' : 'add item'}
        </button>
      </form>
    </Modal>
  )
}
