import { useState } from 'react'
import { ImageOff, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection } from '../services/localStore'

function QrisImage({ path, name }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className="h-40 flex flex-col items-center justify-center gap-2 text-xs text-center px-4 mb-3"
        style={{ border: '1px dashed var(--color-border)', borderRadius: '0.85rem', color: 'var(--color-muted)' }}
      >
        <ImageOff size={20} />
        Drop {name}&rsquo;s QRIS image at {path}
      </div>
    )
  }

  return (
    <img
      src={path}
      alt={`${name}'s QRIS code`}
      onError={() => setErrored(true)}
      className="w-40 h-40 object-contain mx-auto mb-3 rounded-xl"
      style={{ backgroundColor: '#fff', padding: '8px' }}
    />
  )
}

function Section({ title, lines, onRemove, onSubmit, submitted, emptyText, payment }) {
  const total = lines.reduce((sum, l) => sum + l.price, 0)

  if (submitted) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-3">{title}</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--color-success)' }}>
          Order sent &mdash; Pay {payment.name} below
        </p>
        {payment.qris && <QrisImage path={payment.qrisPath} name={payment.name} />}
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Transfer to {payment.name} &mdash; {payment.number}
        </p>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-1">{title}</h2>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {emptyText}
        </p>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-medium mb-3">{title}</h2>
      <div className="flex flex-col gap-3 mb-4">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between text-sm">
            <div>
              <p>{line.name}</p>
              {line.sauce && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {line.sauce} sauce
                </p>
              )}
              {line.options && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {Object.entries(line.options)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(', ') || 'No Extras'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>Rp {line.price.toLocaleString('id-ID')}</span>
              <button onClick={() => onRemove(line.id)} aria-label="Remove Item" style={{ color: 'var(--color-muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between pt-3 mb-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span className="text-sm font-medium">Total</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
          Rp {total.toLocaleString('id-ID')}
        </span>
      </div>
      <button onClick={onSubmit} className="btn-primary w-full py-3 text-sm">
        Submit Order
      </button>
    </div>
  )
}

export default function Cart() {
  const { saladCart, coffeeCart, removeSaladLine, removeCoffeeLine, clearSaladCart, clearCoffeeCart } = useCart()
  const { name } = useUser()
  const saladOrders = useCollection('saladOrders')
  const coffeeOrders = useCollection('coffeeOrders')
  const saladItemsCol = useCollection('saladItems')
  const coffeeItemsCol = useCollection('coffeeItems')
  const [submittedSalad, setSubmittedSalad] = useState(false)
  const [submittedCoffee, setSubmittedCoffee] = useState(false)

  // Each line in the cart is one unit of an item, so ordering decrements
  // that item's stock by one per line — only for items that track stock
  // at all (stock === null means unlimited, see menuData.js).
  const decrementStock = (lines, itemsCol) => {
    lines.forEach((line) => {
      const item = itemsCol.items.find((i) => i.id === line.itemId)
      if (item && typeof item.stock === 'number') {
        itemsCol.update(item.id, { stock: Math.max(0, item.stock - 1) })
      }
    })
  }

  const submitSalad = () => {
    const total = saladCart.reduce((sum, l) => sum + l.price, 0)
    saladOrders.add({ customerName: name, items: saladCart, paid: false, submittedAt: Date.now(), total })
    decrementStock(saladCart, saladItemsCol)
    clearSaladCart()
    setSubmittedSalad(true)
  }

  const submitCoffee = () => {
    const total = coffeeCart.reduce((sum, l) => sum + l.price, 0)
    coffeeOrders.add({ customerName: name, items: coffeeCart, paid: false, submittedAt: Date.now(), total })
    decrementStock(coffeeCart, coffeeItemsCol)
    clearCoffeeCart()
    setSubmittedCoffee(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold mb-1">Your Cart</h1>
      <Section
        title="Salad Corner"
        lines={saladCart}
        onRemove={removeSaladLine}
        onSubmit={submitSalad}
        submitted={submittedSalad}
        emptyText="No salad items yet — head to the Salad Corner to add some."
        payment={{ qris: true, qrisPath: '/images/payment/qris-zac.png', name: 'Zack', number: 'MANDIRI: 1300028849506' }}
      />
      <Section
        title="Coffee Corner"
        lines={coffeeCart}
        onRemove={removeCoffeeLine}
        onSubmit={submitCoffee}
        submitted={submittedCoffee}
        emptyText="No drinks yet — head to the Coffee Corner to add some."
        payment={{ qris: false, name: 'Vel', number: 'MANDIRI: 1300028849340' }}
      />
    </div>
  )
}
