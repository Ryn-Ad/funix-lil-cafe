import { useCornerStatus } from '../hooks/useCornerStatus'

// The open/closed panel at the top of each admin dashboard. The corner
// opens and closes by itself on its schedule; the buttons here are only
// for same-day exceptions, and they expire at midnight on their own.
export default function CornerStatusCard({ corner }) {
  const s = useCornerStatus(corner)

  let headline = `open — closes at ${s.closes}`
  if (!s.isOpen) headline = s.reason === 'override_closed' ? 'closed for today (manual)' : s.message.replace(/ It opens.*/, '')

  return (
    <div className="card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
      <div>
        <p className="text-sm font-medium">{headline}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          schedule: {s.schedule} (Jakarta time) &mdash; buttons here are one-day overrides
        </p>
      </div>
      {s.isOpen && (
        <button onClick={() => s.setOverride('closed')} className="btn-outline text-xs px-4 py-2">
          close for today
        </button>
      )}
      {s.reason === 'override_closed' && (
        <button onClick={() => s.setOverride(null)} className="btn-primary text-xs px-4 py-2">
          reopen
        </button>
      )}
      {s.reason === 'closed_day' && (
        <button onClick={() => s.setOverride('open')} className="btn-primary text-xs px-4 py-2">
          open today anyway
        </button>
      )}
    </div>
  )
}
