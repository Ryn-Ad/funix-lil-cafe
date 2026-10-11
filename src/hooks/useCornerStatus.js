import { useEffect, useState } from 'react'
import { useDoc } from '../services/localStore'
import { getCornerStatus, jakartaParts, describeSchedule, closedMessage } from '../../shared/schedule.js'

// Whether a corner is open right now, decided from the clock plus the
// admin's optional same-day override (stored at settings/{corner}Corner).
// Re-checks every 30 seconds, so a page left open flips to "closed" at
// closing time without a refresh.
export function useCornerStatus(corner) {
  const { value, save } = useDoc(corner === 'salad' ? 'saladCorner' : 'coffeeCorner', {})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const override = value?.override || null
  const status = getCornerStatus(corner, now, override)

  // state: 'open' | 'closed' | null (clear). Only ever applies to today.
  const setOverride = (state) =>
    save({ override: state ? { date: jakartaParts(Date.now()).dateKey, state } : null })

  return {
    ...status,
    override,
    setOverride,
    schedule: describeSchedule(corner),
    message: status.isOpen ? '' : closedMessage(corner, status),
  }
}
