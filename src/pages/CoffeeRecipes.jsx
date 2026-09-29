import { useState } from 'react'
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { useCollection } from '../services/localStore'
import AddRecipeModal from '../components/AddRecipeModal'

export default function CoffeeRecipes() {
  const recipes = useCollection('coffeeRecipes')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (recipe) => {
    setEditing(recipe)
    setModalOpen(true)
  }
  const handleSubmit = (data) => {
    if (editing) recipes.update(editing.id, data)
    else recipes.add(data)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Coffee Recipes</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Private notes &mdash; not shown in the Coffee Corner
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
          <Plus size={14} /> Add Recipe
        </button>
      </div>

      {recipes.items.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          No recipes saved yet.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {recipes.items.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} color="var(--color-accent)" />
                <h2 className="text-sm font-medium">{r.title}</h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => openEdit(r)} aria-label="Edit recipe" style={{ color: 'var(--color-muted)' }}>
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => recipes.remove(r.id)}
                  aria-label="Delete recipe"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {r.ingredients && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Ingredients
                </p>
                <p className="text-xs whitespace-pre-line">{r.ingredients}</p>
              </div>
            )}
            {r.steps && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-muted)' }}>
                  Steps
                </p>
                <p className="text-xs whitespace-pre-line">{r.steps}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <AddRecipeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValue={editing}
      />
    </div>
  )
}
