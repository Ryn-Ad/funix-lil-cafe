import { useState } from 'react'
import { Salad, Sandwich } from 'lucide-react'
import ItemCard from '../components/ItemCard'
import SaucePicker from '../components/SaucePicker'
import AddItemCard from '../components/AddItemCard'
import AddItemModal from '../components/AddItemModal'
import SectionDivider from '../components/SectionDivider'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection, useDoc } from '../services/localStore'

const TILE_COLORS = ['#FF6400', '#7C6FF0', '#2FB6A3', '#E85D75']

function isOutOfStock(item) {
  return typeof item.stock === 'number' && item.stock <= 0
}

export default function SaladCorner() {
  const { addSaladLine } = useCart()
  const { role } = useUser()
  const canManage = role === 'owner' || role === 'salad_admin'
  const saladItemsCol = useCollection('saladItems')
  const { value: settings } = useDoc('saladCornerSettings', {
    isOpen: true,
    closesAt: Date.now() + 6 * 60 * 60 * 1000,
  })
  const [selections, setSelections] = useState({})
  const [added, setAdded] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const isOpen = settings.isOpen && Date.now() < settings.closesAt
  const salads = saladItemsCol.items.filter((i) => i.category === 'salad')
  const snacks = saladItemsCol.items.filter((i) => i.category === 'snack')

  const flashAdded = (id) => {
    setAdded((a) => ({ ...a, [id]: true }))
    setTimeout(() => setAdded((a) => ({ ...a, [id]: false })), 1200)
  }

  const handleAddSalad = (item) => {
    const sauce = selections[item.id]
    if (!sauce || isOutOfStock(item) || !isOpen) return
    addSaladLine({ itemId: item.id, name: item.name, sauce, price: item.price })
    flashAdded(item.id)
  }

  const handleAddSnack = (item) => {
    if (isOutOfStock(item) || !isOpen) return
    addSaladLine({ itemId: item.id, name: item.name, sauce: null, price: item.price })
    flashAdded(item.id)
  }

  const openAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditingItem(item)
    setModalOpen(true)
  }
  const handleModalSubmit = (data) => {
    if (editingItem) saladItemsCol.update(editingItem.id, data)
    else saladItemsCol.add(data)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Salad Corner</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Pre-order today, get it tomorrow.
          </p>
        </div>
        <span
          className="pill text-xs px-3 py-1.5 font-medium"
          style={{
            backgroundColor: isOpen ? 'var(--color-accent-soft)' : 'transparent',
            color: isOpen ? 'var(--color-accent)' : 'var(--color-muted)',
            border: isOpen ? 'none' : '1px solid var(--color-border)',
          }}
        >
          {isOpen ? 'Open for Pre-order' : 'Closed'}
        </span>
      </div>

      {!isOpen && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          {canManage
            ? 'Closed to customers right now — Open it from the admin dashboard when ready.'
            : "Zack hasn't opened the Salad Corner yet — Check back later."}
        </p>
      )}

      {(isOpen || canManage) && (
        <>
          <SectionDivider label="salads" />
          {salads.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              No Salads yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {salads.map((item, i) => (
                <ItemCard
                  key={item.id}
                  tag="salad"
                  title={item.name}
                  price={item.price}
                  icon={Salad}
                  image={item.image}
                  tileColor={TILE_COLORS[i % TILE_COLORS.length]}
                  outOfStock={isOutOfStock(item)}
                  onAdd={() => handleAddSalad(item)}
                  onEdit={canManage ? () => openEdit(item) : undefined}
                  disabled={!selections[item.id] || !isOpen}
                  added={added[item.id]}
                >
                  <SaucePicker
                    sauces={item.sauces || []}
                    selected={selections[item.id]}
                    onSelect={(sauce) => setSelections((s) => ({ ...s, [item.id]: sauce }))}
                  />
                </ItemCard>
              ))}
            </div>
          )}

          <SectionDivider label="snacks" />
          {snacks.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              No Snacks yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {snacks.map((item, i) => (
                <ItemCard
                  key={item.id}
                  tag="snack"
                  title={item.name}
                  price={item.price}
                  icon={Sandwich}
                  image={item.image}
                  tileColor={TILE_COLORS[(salads.length + i) % TILE_COLORS.length]}
                  outOfStock={isOutOfStock(item)}
                  onAdd={() => handleAddSnack(item)}
                  onEdit={canManage ? () => openEdit(item) : undefined}
                  disabled={!isOpen}
                  added={added[item.id]}
                />
              ))}
            </div>
          )}

          {canManage && (
            <>
              <SectionDivider label="manage" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AddItemCard onClick={openAdd} />
              </div>
            </>
          )}
        </>
      )}

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        itemType="salad"
        onSubmit={handleModalSubmit}
        initialValue={editingItem}
      />
    </div>
  )
}
