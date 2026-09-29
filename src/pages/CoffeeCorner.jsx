import { useState } from 'react'
import { Coffee, GlassWater } from 'lucide-react'
import ItemCard from '../components/ItemCard'
import CoffeeOptions from '../components/CoffeeOptions'
import AddItemCard from '../components/AddItemCard'
import AddItemModal from '../components/AddItemModal'
import SectionDivider from '../components/SectionDivider'
import { COFFEE_OPTION_DELTAS } from '../data/menuData'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection } from '../services/localStore'

const TILE_COLORS = ['#FF6400', '#7C6FF0', '#2FB6A3', '#E85D75', '#FF6400']

function emptyOptions() {
  return { milk: false, chocolate: false, foamy: false }
}

function isOutOfStock(item) {
  return typeof item.stock === 'number' && item.stock <= 0
}

export default function CoffeeCorner() {
  const { addCoffeeLine } = useCart()
  const { role } = useUser()
  const canManage = role === 'owner' || role === 'coffee_admin'
  const coffeeItemsCol = useCollection('coffeeItems')
  const [options, setOptions] = useState({})
  const [added, setAdded] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const toggle = (id, key) => {
    setOptions((o) => {
      const current = o[id] || emptyOptions()
      return { ...o, [id]: { ...current, [key]: !current[key] } }
    })
  }

  const totalFor = (item) => {
    if (!item.hasOptions) return item.price
    const opts = options[item.id] || emptyOptions()
    return (
      item.price +
      Object.entries(opts).reduce((sum, [key, on]) => (on ? sum + COFFEE_OPTION_DELTAS[key] : sum), 0)
    )
  }

  const flashAdded = (id) => {
    setAdded((a) => ({ ...a, [id]: true }))
    setTimeout(() => setAdded((a) => ({ ...a, [id]: false })), 1200)
  }

  const handleAdd = (item) => {
    if (isOutOfStock(item)) return
    const opts = item.hasOptions ? options[item.id] || emptyOptions() : null
    addCoffeeLine({ itemId: item.id, name: item.name, options: opts, price: totalFor(item) })
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
    if (editingItem) coffeeItemsCol.update(editingItem.id, data)
    else coffeeItemsCol.add(data)
  }

  const coffees = coffeeItemsCol.items.filter((i) => i.category === 'coffee')
  const nonCoffees = coffeeItemsCol.items.filter((i) => i.category === 'non-coffee')

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Coffee Corner</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          Order anytime, no pre-order
        </p>
      </div>

      <SectionDivider label="coffee" />
      {coffees.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          No coffee items yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coffees.map((item, i) => (
            <ItemCard
              key={item.id}
              tag="coffee"
              title={item.name}
              price={totalFor(item)}
              icon={Coffee}
              image={item.image}
              tileColor={TILE_COLORS[i % TILE_COLORS.length]}
              outOfStock={isOutOfStock(item)}
              stockLeft={typeof item.stock === 'number' ? item.stock : undefined}
              onAdd={() => handleAdd(item)}
              onEdit={canManage ? () => openEdit(item) : undefined}
              added={added[item.id]}
            >
              {item.hasOptions && (
                <CoffeeOptions
                  values={options[item.id] || emptyOptions()}
                  onToggle={(key) => toggle(item.id, key)}
                />
              )}
            </ItemCard>
          ))}
        </div>
      )}

      <SectionDivider label="non-coffee" />
      {nonCoffees.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          No Non-coffee items yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {nonCoffees.map((item, i) => (
            <ItemCard
              key={item.id}
              tag="non-coffee"
              title={item.name}
              price={totalFor(item)}
              icon={GlassWater}
              image={item.image}
              tileColor={TILE_COLORS[(coffees.length + i) % TILE_COLORS.length]}
              outOfStock={isOutOfStock(item)}
              stockLeft={typeof item.stock === 'number' ? item.stock : undefined}
              onAdd={() => handleAdd(item)}
              onEdit={canManage ? () => openEdit(item) : undefined}
              added={added[item.id]}
            >
              {item.hasOptions && (
                <CoffeeOptions
                  values={options[item.id] || emptyOptions()}
                  onToggle={(key) => toggle(item.id, key)}
                />
              )}
            </ItemCard>
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

      <AddItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        itemType="coffee"
        onSubmit={handleModalSubmit}
        initialValue={editingItem}
      />
    </div>
  )
}
