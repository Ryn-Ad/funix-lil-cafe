import { useState } from 'react'
import { Coffee, GlassWater } from 'lucide-react'
import ItemCard from '../components/ItemCard'
import CoffeeOptions from '../components/CoffeeOptions'
import AddItemCard from '../components/AddItemCard'
import AddItemModal from '../components/AddItemModal'
import EntryModal from '../components/EntryModal'
import ManageList from '../components/ManageList'
import SectionDivider from '../components/SectionDivider'
import { DEFAULT_COFFEE_OPTIONS } from '../data/menuData'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection } from '../services/localStore'
import { useCornerStatus } from '../hooks/useCornerStatus'
import { useState } from 'react'
import { GRID, isOutOfStock, TILE_COLORS } from '../../../../../../../Temp/RAR_Temps/Rar$DIa8964.21390/CoffeeCorner'

const TILE_COLORS = ['#FF6400', '#7C6FF0', '#2FB6A3', '#E85D75', '#FF6400']
const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'

function isOutOfStock(item) {
  return typeof item.stock === 'number' && item.stock <= 0
}

export default function CoffeeCorner() {
  const { addCoffeeLine } = useCart()
  const { role } = useUser()
  const canManage = role === 'owner' || role === 'coffee_admin'
  const itemsCol = useCollection('coffeeItems')
  const optionsCol = useCollection('coffeeOptions')
  const status = useCornerStatus('coffee')

  const [selected, setSelected] = useState({}) // { [itemId]: { [optionId]: true } }
  const [added, setAdded] = useState({})
  const [itemModal, setItemModal] = useState({ open: false, item: null })
  const [optionModal, setOptionModal] = useState({ open: false, option: null })

  const options = [...optionsCol.items].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))
  const coffees = itemsCol.items.filter((i) => i.category === 'coffee')
  const nonCoffees = itemsCol.items.filter((i) => i.category === 'non-coffee')

  const chosenOptions = (item) => (item.hasOptions ? options.filter((o) => selected[item.id]?.[o.id]) : [])
  const totalFor = (item) => item.price + chosenOptions(item).reduce((sum, o) => sum + o.price, 0)

  const toggle = (itemId, optionId) =>
    setSelected((s) => ({ ...s, [itemId]: { ...s[itemId], [optionId]: !s[itemId]?.[optionId] } }))

  const flashAdded = (id) => {
    setAdded((a) => ({ ...a, [id]: true }))
    setTimeout(() => setAdded((a) => ({ ...a, [id]: false })), 1200)
  }

  const handleAdd = (item) => {
    if (isOutOfStock(item) || !status.isOpen) return
    const chosen = chosenOptions(item)
    addCoffeeLine({
      itemId: item.id,
      name: item.name,
      optionIds: chosen.map((o) => o.id),
      optionNames: chosen.map((o) => o.name),
      price: totalFor(item),
    })
    flashAdded(item.id)
  }

  const saveItem = (data) => (itemModal.item ? itemsCol.update(itemModal.item.id, data) : itemsCol.add(data))
  const saveOption = (data) => (optionModal.option ? optionsCol.update(optionModal.option.id, data) : optionsCol.add(data))
  const addDefaultOptions = () => DEFAULT_COFFEE_OPTIONS.forEach((o) => optionsCol.add(o))

  const renderCard = (item, i, tag, icon, offset) => (
    <ItemCard
      key={item.id}
      tag={tag}
      title={item.name}
      price={totalFor(item)}
      icon={icon}
      image={item.image}
      tileColor={TILE_COLORS[(offset + i) % TILE_COLORS.length]}
      outOfStock={isOutOfStock(item)}
      stockLeft={typeof item.stock === 'number' ? item.stock : undefined}
      onAdd={() => handleAdd(item)}
      onEdit={canManage ? () => setItemModal({ open: true, item }) : undefined}
      disabled={!status.isOpen}
      added={added[item.id]}
    >
      {item.hasOptions && options.length > 0 && (
        <CoffeeOptions options={options} values={selected[item.id] || {}} onToggle={(id) => toggle(item.id, id)} />
      )}
    </ItemCard>
  )
  
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-semibold">Coffee Corner</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Order while we&rsquo;re open &middot; {status.schedule}
          </p>
        </div>
        <span
          className="pill text-xs px-3 py-1.5 font-medium shrink-0"
          style={{
            backgroundColor: status.isOpen ? 'var(--color-accent-soft)' : 'transparent',
            color: status.isOpen ? 'var(--color-accent)' : 'var(--color-muted)',
            border: status.isOpen ? 'none' : '1px solid var(--color-border)',
          }}
        >
          {status.isOpen ? `Ppen until ${status.closes}` : 'Closed'}
        </span>
      </div>

      {!status.isOpen && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          {status.message}
        </p>
      )}

      {(status.isOpen || canManage) && (
        <>
          <SectionDivider label="coffee" />
          {coffees.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              No Coffee items yet.
            </p>
          ) : (
            <div className={GRID}>{coffees.map((item, i) => renderCard(item, i, 'coffee', Coffee, 0))}</div>
          )}

          <SectionDivider label="non-coffee" />
          {nonCoffees.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              No Non-Coffee items yet.
            </p>
          ) : (
            <div className={GRID}>
              {nonCoffees.map((item, i) => renderCard(item, i, 'non-coffee', GlassWater, coffees.length))}
            </div>
          )}

          {canManage && (
            <>
              <SectionDivider label="Manage" />
              <div className={GRID}>
                <AddItemCard onClick={() => setItemModal({ open: true, item: null })} />
                <AddItemCard label="Add Options" onClick={() => setOptionModal({ open: true, option: null })} />
              </div>
              <ManageList
                title="Options"
                entries={options.map((o) => ({
                  id: o.id,
                  label: o.name,
                  detail: o.price > 0 ? `+${o.price.toLocaleString('id-ID')}` : 'Free',
                  raw: o,
                }))}
                onEdit={(entry) => setOptionModal({ open: true, option: entry.raw })}
                onDelete={(id) => optionsCol.remove(id)}
              >
                <button onClick={addDefaultOptions} className="btn-outline text-xs px-3 py-1.5">
                  Add options (Milk, Chocolate, Foamy, Condensed Milk)
                </button>
              </ManageList>
            </>
          )}
        </>
      )}

      <AddItemModal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false, item: null })}
        itemType="coffee"
        onSubmit={saveItem}
        initialValue={itemModal.item}
      />
      <EntryModal
        open={optionModal.open}
        onClose={() => setOptionModal({ open: false, option: null })}
        onSubmit={saveOption}
        title="Options"
        withPrice
        initialValue={optionModal.option}
      />
    </div>
  )
}
