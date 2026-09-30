import { Trash2 } from 'lucide-react'
import { useCollection, useDoc } from '../services/localStore'
import { groupOrdersByDate } from '../utils/orderGrouping'
import SectionDivider from '../components/SectionDivider'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// Today at a given hour, in the browser's local time — used for the
// manual override button so it matches the 12:00–20:00 schedule that
// api/cron/open-salad.js and api/cron/close-salad.js run automatically.
function todayAt(hour, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

export default function AdminSalad() {
  const { value: settings, save } = useDoc('saladCornerSettings', { isOpen: false, closesAt: 0 })
  const orders = useCollection('saladOrders')

  const isOpen = settings.isOpen && Date.now() < settings.closesAt
  const closeTime = isOpen ? formatTime(settings.closesAt) : null

  const openCorner = () => save({ isOpen: true, closesAt: todayAt(20, 0) })
  const closeCorner = () => save({ isOpen: false })
  const togglePaid = (id, current) => orders.update(id, { paid: !current })

  const dateGroups = groupOrdersByDate(orders.items)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-semibold mb-4">Salad Corner &mdash; Admin</h1>

      <div className="card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium">{isOpen ? `Open — Closes in ~${closeTime}h` : 'Closed'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            Open automatically at 12:00, Closes at 20:00 &mdash; buttons here are for manual override only
          </p>
        </div>
        {isOpen ? (
          <button onClick={closeCorner} className="btn-outline text-xs px-4 py-2">
            Close now
          </button>
        ) : (
          <button onClick={openCorner} className="btn-primary text-xs px-4 py-2">
            Open until 20:00
          </button>
        )}
      </div>

      <h2 className="text-sm font-medium mb-3">Orders ({orders.items.length})</h2>
      {dateGroups.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          no orders yet.
        </p>
      )}
        {dateGroups.map((group) => (
        <div key={group.label}>
          <SectionDivider label={group.label} />
          <div className="flex flex-col gap-2">
            {group.orders.map((order) => (
              <div key={order.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm">{order.customerName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {order.items.map((it) => `${it.name}${it.sauce ? ` (${it.sauce})` : ''}`).join(', ')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Rp {(order.total ?? 0).toLocaleString('id-ID')} &middot; {formatTime(order.submittedAt)}
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
                    {order.paid ? 'Paid' : 'Not Paid'}
                  </button>
                  <button
                    onClick={() => orders.remove(order.id)}
                    aria-label="Delete order"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}