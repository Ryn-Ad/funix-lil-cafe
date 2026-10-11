import { Trash2 } from 'lucide-react'
import { useCollection } from '../services/localStore'
import { groupOrdersByDate } from '../utils/orderGrouping'
import SectionDivider from '../components/SectionDivider'
import CornerStatusCard from '../components/CornerStatusCard'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminSalad() {
  const orders = useCollection('saladOrders')
  const togglePaid = (id, current) => orders.update(id, { paid: !current })
  
  const dateGroups = groupOrdersByDate(orders.items)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-semibold mb-4">Salad Corner &mdash; Admin</h1>

      <CornerStatusCard corner="salad" />

      <h2 className="text-sm font-medium mb-3">Orders ({orders.items.length})</h2>
      {dateGroups.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          No orders yet.
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