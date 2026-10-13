import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { submitOrder } from '../services/orders'
import { useMyOrders } from '../services/myOrders'
import MyOrders from '../components/MyOrders'

function lineDetail(line) {
  if (line.sauce) return `${line.sauce} sauce`
  if (line.optionNames) return line.optionNames.length ? line.optionNames.join(', ') : 'no extras'
  return null
}

function Section({ title, lines, onRemove, onSubmit, submitting, error, emptyText }) {
  const total = lines.reduce((sum, l) => sum + l.price, 0)

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
                {lineDetail(line) && (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {lineDetail(line)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span>Rp {line.price.toLocaleString('id-ID')}</span>
                <button onClick={() => onRemove(line.id)} aria-label="Remove item" style={{ color: 'var(--color-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 mb-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-sm font-medium">Total</span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
            Rp {total.toLocaleString('id-ID')}
          </span>
        </div>
        {error && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        <button onClick={onSubmit} disabled={submitting} className="btn-primary w-full py-3 text-sm">
          {submitting ? 'Sending…' : 'Submit Order'}
        </button>
      </div>
    )
  }

export default function Cart() {
  const { saladCart, coffeeCart, removeSaladLine, removeCoffeeLine, clearSaladCart, clearCoffeeCart } = useCart()
  const { name } = useUser()
  const myOrders = useMyOrders(name)
  const [justOrderedId, setJustOrderedId] = useState(null)
  const [state, setState] = useState({
    salad: { submitting: false, error: '' },
    coffee: { submitting: false, error: '' },
  })

  const patch = (corner, changes) => setState((s) => ({ ...s, [corner]: { ...s[corner], ...changes } }))

  const send = async (corner, cartLines, lines, clear) => {
    patch(corner, { submitting: true, error: '' })
    try {
      const result = await submitOrder({ corner, customerName: name, lines })
    
      const localTotal = cartLines.reduce((sum, l) => sum + l.price, 0)
      const total = Number.isFinite(result.total) ? result.total : localTotal
      const id = result.orderId || `local-${Date.now()}`
    
      myOrders.add({
        id,
        corner,
        customerName: name,
        submittedAt: Date.now(),
        total,
        lines: cartLines.map((l) => ({ name: l.name, detail: lineDetail(l), price: l.price })),
      })
      clear()
      setJustOrderedId(id)
      patch(corner, { submitting: false })
    } catch (err) {
      patch(corner, { submitting: false, error: err.message })
    }
  }

  const submitSalad = () =>
    send('salad', saladCart, saladCart.map((l) => ({ itemId: l.itemId, sauceId: l.sauceId })), clearSaladCart)
  const submitCoffee = () =>
    send('coffee', coffeeCart, coffeeCart.map((l) => ({ itemId: l.itemId, optionIds: l.optionIds })), clearCoffeeCart)
    
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-semibold mb-1">Your Cart</h1>
      <Section
        title="Salad Corner"
        lines={saladCart}
        onRemove={removeSaladLine}
        onSubmit={submitSalad}
        submitting={state.salad.submitting}
        error={state.salad.error}
        emptyText="No salad items yet — Head to the Salad Corner to add some."
      />
      <Section
        title="Coffee Corner"
        lines={coffeeCart}
        onRemove={removeCoffeeLine}
        onSubmit={submitCoffee}
        submitting={state.coffee.submitting}
        error={state.coffee.error}
        emptyText="No drinks yet — Head to the Coffee Corner to add some."
      />
      <MyOrders orders={myOrders.orders} justOrderedId={justOrderedId} onForget={myOrders.forget} />
    </div>
  )
}
