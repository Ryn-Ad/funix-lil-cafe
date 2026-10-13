import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import ImageLightbox from './ImageLightbox'
import { PAYMENTS } from '../config/payments'

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
        drop {name}&rsquo;s QRIS image at {path}
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
      {zoomed && <ImageLightbox src={path} alt={`${name}'s QRIS code`} onClose={() => setZoomed(false)} />}
    </>
  )
}

// Everything a customer needs to pay for one corner's order: the QRIS
// image (tap to enlarge) and the transfer numbers.
export default function PaymentInfo({ corner }) {
  const payment = PAYMENTS[corner]
  if (!payment) return null
  return (
    <div>
      <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
        pay {payment.name}
      </p>
      {payment.qrisPath && <QrisImage path={payment.qrisPath} name={payment.name} />}
      <div className="flex flex-col gap-1">
        {(payment.banks || []).map(({ bank, number }) => (
          <p key={bank} className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {bank}: {number}
          </p>
        ))}
      </div>
    </div>
  )
}
