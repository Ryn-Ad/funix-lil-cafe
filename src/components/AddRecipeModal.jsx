import { useState, useEffect } from 'react'
import Modal from './Modal'

export default function AddRecipeModal({ open, onClose, onSubmit, initialValue }) {
  const isEdit = !!initialValue
  const [title, setTitle] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [error, setError] = useState('')

  // Re-populate the form every time the modal opens — with the recipe
  // being edited, or blank for a new one.
  useEffect(() => {
    if (open) {
      setTitle(initialValue?.title || '')
      setIngredients(initialValue?.ingredients || '')
      setSteps(initialValue?.steps || '')
      setError('')
    }
  }, [open, initialValue])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give the Recipe a name')
      return
    }
    onSubmit({ title: title.trim(), ingredients, steps })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Recipe' : 'Add Recipe'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="input-field px-3 py-2 text-sm"
          placeholder="Recipe Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-field px-3 py-2 text-sm"
          rows={3}
          placeholder="Ingredients (one per line)"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
        <textarea
          className="input-field px-3 py-2 text-sm"
          rows={4}
          placeholder="Steps (one per line)"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />
        {error && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary py-2.5 text-sm mt-1">
          {isEdit ? 'Save Changes' : 'Save Recipe'}
        </button>
      </form>
    </Modal>
  )
}
