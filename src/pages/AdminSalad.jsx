import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useCollection, useDoc } from '../services/localStore'

const HOUR = 60 * 60 * 1000

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminSalad() {
  const { value: settings, save } = useDoc('saladCornerSettings', { isOpen: false, closesAt: 0 })
  const orders = useCollection('saladOrders')
  const [hours, setHours] = useState(6)

  const isOpen = settings.isOpen && Date.now() < settings.closesAt
  const hoursLeft = isOpen ? Math.max(0, Math.round(((settings.closesAt - Date.now()) / HOUR) * 10) / 10) : 0

  const openCorner = () => {
    const h = Number(hours) || 6
    save({ isOpen: true, closesAt: Date.now() + h * HOUR })
  }
  const closeCorner = () => save({ isOpen: false })
  const togglePaid = (id, current) => orders.update(id, { paid: !current })

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-semibold mb-4">Salad Corner &mdash; Admin</h1>

      <div className="card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium">{isOpen ? `Open — Closes in ~${hoursLeft}h` : 'Closed'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Customers can pre-order while open
          </p>
        </div>
        {isOpen ? (
          <button onClick={closeCorner} className="btn-outline text-xs px-4 py-2">
            Close now
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              aria-label="Hours to stay open"
              className="input-field w-16 px-2 py-2 text-xs text-center"
            />
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Hours
            </span>
            <button onClick={openCorner} className="btn-primary text-xs px-4 py-2">
              Open
            </button>
          </div>
        )}
      </div>

      <h2 className="text-sm font-medium mb-3">Orders ({orders.items.length})</h2>
      <div className="flex flex-col gap-2">
        {orders.items.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            No orders yet.
          </p>
        )}
        {orders.items.map((order) => (
          <div key={order.id} className="card p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm">{order.customerName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {order.items.map((it) => `${it.name}${it.sauce ? ` (${it.sauce})` : ''}`).join(', ')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                Rp {(order.total ?? 0).toLocaleString('id-ID')} &middot; {formatDate(order.submittedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => togglePaid(order.id, order.paid)}
                className="pill text-xs px-3 py-1.5 border"
                style={{
                  borderColor: order.paid ? 'var(--color-success)' : 'var(--color-accent)',
                  color: order.paid ? 'var(--color-success)' : 'var(--color-accent)',
                }}
              >
                {order.paid ? 'paid' : 'not paid'}
              </button>
              <button
                onClick={() => orders.remove(order.id)}
                aria-label="Delete Order"
                style={{ color: 'var(--color-muted)' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
