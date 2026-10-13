import { useState } from 'react'
import { X } from 'lucide-react'
import PaymentInfo from './PaymentInfo'
import { useOrderStatus } from '../hooks/useOrderStatus'

const CORNER_LABEL = { salad: 'salad corner', coffee: 'coffee corner' }

function formatWhen(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusPill({ status }) {
  if (status.loading || status.unknown) return null
  let label = 'waiting for payment'
  let color = 'var(--color-accent)'
  if (!status.exists) {
    label = 'cancelled'
    color = 'var(--color-muted)'
  } else if (status.paid) {
    label = 'paid'
    color = 'var(--color-success)'
  }
  return (
    <span className="pill text-[11px] px-2.5 py-1 border shrink-0" style={{ borderColor: color, color }}>
      {label}
    </span>
  )
}

function OrderCard({ order, defaultOpen, onForget }) {
  const [showPayment, setShowPayment] = useState(defaultOpen)
  const status = useOrderStatus(order.corner, order.id)
  const canPay = status.unknown || (status.exists && !status.paid)

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium">{CORNER_LABEL[order.corner] || order.corner}</p>
          <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {formatWhen(order.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          <button
            onClick={() => onForget(order.id)}
            aria-label="Remove from this list"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {order.lines.map((line, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p>{line.name}</p>
              {line.detail && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {line.detail}
                </p>
              )}
            </div>
            <span className="shrink-0">Rp {(Number(line.price) || 0).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-sm font-medium">total</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
          Rp {(Number(order.total) || 0).toLocaleString('id-ID')}
        </span>
      </div>

      {canPay && (
        <div className="mt-4">
          <button onClick={() => setShowPayment((v) => !v)} className="btn-outline text-xs px-4 py-2">
            {showPayment ? 'hide payment info' : 'how to pay'}
          </button>
          {showPayment && (
            <div className="mt-4">
              <PaymentInfo corner={order.corner} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyOrders({ orders, justOrderedId, onForget }) {
  if (orders.length === 0) return null
  return (
    <section className="mt-4">
      <h2 className="text-sm font-medium mb-1">your orders</h2>
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
        saved on this device for 14 days
      </p>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} defaultOpen={order.id === justOrderedId} onForget={onForget} />
        ))}
      </div>
    </section>
  )
}
