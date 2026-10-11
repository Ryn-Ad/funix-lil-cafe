import { useState } from 'react'
import { Salad, Sandwich } from 'lucide-react'
import ItemCard from '../components/ItemCard'
import SaucePicker from '../components/SaucePicker'
import AddItemCard from '../components/AddItemCard'
import AddItemModal from '../components/AddItemModal'
import EntryModal from '../components/EntryModal'
import ManageList from '../components/ManageList'
import SectionDivider from '../components/SectionDivider'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection } from '../services/localStore'
import { useCornerStatus } from '../hooks/useCornerStatus'
import { DEFAULT_SAUCES } from '../data/menuData'
import { useState } from 'react'
import { isOutOfStock } from '../../../../../../../Temp/RAR_Temps/Rar$DIa8964.19869/SaladCorner'

const TILE_COLORS = ['#FF6400', '#7C6FF0', '#2FB6A3', '#E85D75']
const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'

function isOutOfStock(item) {
  return typeof item.stock === 'number' && item.stock <= 0
}

export default function SaladCorner() {
  const { addSaladLine } = useCart()
  const { role } = useUser()
  const canManage = role === 'owner' || role === 'salad_admin'
  const itemsCol = useCollection('saladItems')
  const saucesCol = useCollection('saladSauces')
  const status = useCornerStatus('salad')

  const [selections, setSelections] = useState({})
  const [added, setAdded] = useState({})
  const [itemModal, setItemModal] = useState({ open: false, item: null })
  const [sauceModal, setSauceModal] = useState({ open: false, sauce: null })

  const sauces = [...saucesCol.items].sort((a, b) => a.name.localeCompare(b.name))
  const salads = itemsCol.items.filter((i) => i.category === 'salad')
  const snacks = itemsCol.items.filter((i) => i.category === 'snack')

  const flashAdded = (id) => {
    setAdded((a) => ({ ...a, [id]: true }))
    setTimeout(() => setAdded((a) => ({ ...a, [id]: false })), 1200)
  }

  const handleAddSalad = (item) => {
    const sauce = sauces.find((s) => s.id === selections[item.id])
    if (!sauce || isOutOfStock(item) || !status.isOpen) return
    addSaladLine({ itemId: item.id, name: item.name, sauceId: sauce.id, sauce: sauce.name, price: item.price })
    flashAdded(item.id)
  }

  const handleAddSnack = (item) => {
    if (isOutOfStock(item) || !status.isOpen) return
    addSaladLine({ itemId: item.id, name: item.name, sauceId: null, sauce: null, price: item.price })
    flashAdded(item.id)
  }

  const saveItem = (data) => (itemModal.item ? itemsCol.update(itemModal.item.id, data) : itemsCol.add(data))
  const saveSauce = (data) => (sauceModal.sauce ? saucesCol.update(sauceModal.sauce.id, data) : saucesCol.add(data))
  const addDefaultSauces = () => DEFAULT_SAUCES.forEach((name) => saucesCol.add({ name }))

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
          className="pill text-xs px-3 py-1.5 font-medium shrink-0"
          style={{
            backgroundColor: status.isOpen ? 'var(--color-accent-soft)' : 'transparent',
            color: status.isOpen ? 'var(--color-accent)' : 'var(--color-muted)',
            border: status.isOpen ? 'none' : '1px solid var(--color-border)',
          }}
        >
          {status.isOpen ? `Open until ${status.closes}` : 'Closed'}
        </span>
      </div>

      {!status.isOpen && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
          {status.message}
        </p>
      )}

      {(status.isOpen || canManage) && (
              <>
                <SectionDivider label="salads" />
                {salads.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    No salads yet.
                  </p>
                ) : (
                  <div className={GRID}>
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
                        onEdit={canManage ? () => setItemModal({ open: true, item }) : undefined}
                        disabled={!selections[item.id] || !status.isOpen}
                        added={added[item.id]}
                      >
                        <SaucePicker
                          sauces={sauces}
                          selected={selections[item.id]}
                          onSelect={(id) => setSelections((s) => ({ ...s, [item.id]: id }))}
                        />
                      </ItemCard>
                    ))}
                  </div>
                )}
      
                <SectionDivider label="snacks" />
                {snacks.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    No snacks yet.
                  </p>
                ) : (
                  <div className={GRID}>
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
                        onEdit={canManage ? () => setItemModal({ open: true, item }) : undefined}
                        disabled={!status.isOpen}
                        added={added[item.id]}
                      />
                    ))}
                  </div>
                )}
      
                {canManage && (
                  <>
                    <SectionDivider label="Manage" />
                    <div className={GRID}>
                      <AddItemCard onClick={() => setItemModal({ open: true, item: null })} />
                      <AddItemCard label="Add Sauce" onClick={() => setSauceModal({ open: true, sauce: null })} />
                    </div>
                    <ManageList
                      title="Sauces"
                      entries={sauces.map((s) => ({ id: s.id, label: s.name, raw: s }))}
                      onEdit={(entry) => setSauceModal({ open: true, sauce: entry.raw })}
                      onDelete={(id) => saucesCol.remove(id)}
                    >
                      <button onClick={addDefaultSauces} className="btn-outline text-xs px-3 py-1.5">
                        Add Sauces ({DEFAULT_SAUCES.join(', ')})
                      </button>
                    </ManageList>
                  </>
                )}
              </>
            )}
      
            <AddItemModal
              open={itemModal.open}
              onClose={() => setItemModal({ open: false, item: null })}
              itemType="salad"
              onSubmit={saveItem}
              initialValue={itemModal.item}
            />
            <EntryModal
              open={sauceModal.open}
              onClose={() => setSauceModal({ open: false, sauce: null })}
              onSubmit={saveSauce}
              title="Sauce"
              initialValue={sauceModal.sauce}
            />
          </div>
        )
      }
