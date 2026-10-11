import { useState } from 'react'
import { ImageOff, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { submitOrder } from '../services/orders'
import ImageLightbox from '../components/ImageLightbox'
import { COFFEE_PAYMENT, lineDetail, SALAD_PAYMENT, Section } from '../../../../../../../Temp/RAR_Temps/Rar$DIa8964.37386/Cart'
import { useState } from 'react'

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

function lineDetail(line) {
  if (line.sauce) return `${line.sauce} sauce`
  if (line.optionNames) return line.optionNames.length ? line.optionNames.join(', ') : 'No extras'
  return null
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
        <p className="text-sm font-medium mb-4">Total to pay: Rp {paidTotal.toLocaleString('id-ID')}</p>
        {payment.qris && <QrisImage path={payment.qrisPath} name={payment.name} />}
        <TransferLines banks={payment.banks} />
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
      <div
        className="flex items-center justify-between pt-3 mb-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
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

const SALAD_PAYMENT = {
  qris: true,
  qrisPath: '/images/payment/qris-zac.png',
  name: 'Zack',
  banks: [{ bank: 'BANK MANDIRI', number: '1300028849506' }],
}
const COFFEE_PAYMENT = {
  qris: true,
  qrisPath: '/images/payment/qris-vel.png',
  name: 'Vel',
  banks: [
    { bank: 'BANK BCA', number: '7940423851' },
    { bank: 'BANK JAGO', number: '106747962160' },
    { bank: 'BANK MANDIRI', number: '1300028849340' },
  ],
}

export default function Cart() {
  const { saladCart, coffeeCart, removeSaladLine, removeCoffeeLine, clearSaladCart, clearCoffeeCart } = useCart()
  const { name } = useUser()
  const [state, setState] = useState({
    salad: { submitting: false, error: '', total: null },
    coffee: { submitting: false, error: '', total: null },
  })

  const patch = (corner, changes) => setState((s) => ({ ...s, [corner]: { ...s[corner], ...changes } }))

  // The server checks opening hours, prices every line from the menu,
  // checks stock and saves the order — we only say what was picked.
  const send = async (corner, lines, clear) => {
    patch(corner, { submitting: true, error: '' })
    try {
      const result = await submitOrder({ corner, customerName: name, lines })
      clear()
      patch(corner, { submitting: false, total: result.total })
    } catch (err) {
      patch(corner, { submitting: false, error: err.message })
    }
  }

  const submitSalad = () =>
    send('salad', saladCart.map((l) => ({ itemId: l.itemId, sauceId: l.sauceId })), clearSaladCart)
  const submitCoffee = () =>
    send('coffee', coffeeCart.map((l) => ({ itemId: l.itemId, optionIds: l.optionIds })), clearCoffeeCart)

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
        submitted={state.salad.total !== null}
        paidTotal={state.salad.total}
        emptyText="No salad items yet — head to the Salad Corner to add some."
        payment={SALAD_PAYMENT}
      />
      <Section
        title="Coffee Corner"
        lines={coffeeCart}
        onRemove={removeCoffeeLine}
        onSubmit={submitCoffee}
        submitting={state.coffee.submitting}
        error={state.coffee.error}
        submitted={state.coffee.total !== null}
        paidTotal={state.coffee.total}
        emptyText="No drinks yet — head to the Coffee Corner to add some."
        payment={COFFEE_PAYMENT}
      />
    </div>
  )
}
