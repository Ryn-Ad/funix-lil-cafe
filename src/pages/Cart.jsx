import { useState } from 'react'
import { ImageOff, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useCollection, decrementStock } from '../services/localStore'
import ImageLightbox from '../components/ImageLightbox'

function QrisImage({ path, name }) {
  const [errored, setErrored] = useState(false)
  const [zoomed, setZoomed] = useState(false)

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
    <>
      <img
        src={path}
        alt={`${name}'s QRIS code — tap to enlarge`}
        onError={() => setErrored(true)}
        onClick={() => setZoomed(true)}
        className="w-40 h-40 object-contain mx-auto mb-3 rounded-xl cursor-zoom-in"
        style={{ backgroundColor: '#fff', padding: '8px' }}
      />
      {zoomed && (
        <ImageLightbox src={path} alt={`${name}'s QRIS code`} onClose={() => setZoomed(false)} />
      )}
    </>
  )
}

function TransferLines({ banks }) {
  return (
    <div className="flex flex-col gap-1">
      {banks.map(({ bank, number }) => (
        <p key={bank} className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {bank}: {number}
        </p>
      ))}
    </div>
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
        {payment.banks ? (
          <TransferLines banks={payment.banks} />
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            transfer to {payment.name} &mdash; {payment.number}
          </p>
        )}
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
  const [submittedSalad, setSubmittedSalad] = useState(false)
  const [submittedCoffee, setSubmittedCoffee] = useState(false)

  // Each line in the cart is one unit of an item, so ordering decrements
  // that item's stock by one per line — only for items that track stock
  // at all (stock === null means unlimited, see menuData.js).
  const runStockDecrements = (collectionKey, lines) => {
    lines.forEach((line) => {
      decrementStock(collectionKey, line.itemId).catch((err) =>
        console.error(`Stock update failed for ${line.itemId}:`, err)
      )
    })
  }

  const submitSalad = () => {
    const total = saladCart.reduce((sum, l) => sum + l.price, 0)
    saladOrders.add({ customerName: name, items: saladCart, paid: false, submittedAt: Date.now(), total })
    runStockDecrements('saladItems', saladCart)
    clearSaladCart()
    setSubmittedSalad(true)
  }

  const submitCoffee = () => {
    const total = coffeeCart.reduce((sum, l) => sum + l.price, 0)
    const order = { customerName: name, items: coffeeCart, paid: false, submittedAt: Date.now(), total }
    coffeeOrders.add(order)
    runStockDecrements('coffeeItems', coffeeCart)

    // Fire-and-forget: Vel and Ryn get a Discord DM for every coffee
    // order. If this fails (offline, Discord hiccup), the order itself
    // is already safely saved above, so we only log it, never block or
    // warn the customer. Only works once deployed to Vercel — see
    // DISCORD_SETUP.md for local testing with `vercel dev`.
    fetch('/api/notify-coffee-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch((err) => console.error('Discord notify failed:', err))

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
        payment={{
          qris: false,
          name: 'Vel',
          banks: [
            { bank: 'BANK BCA', number: '7940423851' },
            { bank: 'BANK JAGO', number: '106747962160' },
            { bank: 'BANK MANDIRI', number: '1300028849340' },
          ],
        }}
      />
    </div>
  )
}
