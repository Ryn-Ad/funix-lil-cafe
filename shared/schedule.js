// Shared by the browser (src/) and the serverless functions (api/) so
// both always agree on when each corner is open.
//
// Everything is pinned to Western Indonesia Time (WIB, UTC+7, no
// daylight saving): "12:00" means 12:00 in Jakarta whether the visitor's
// phone is set to Jakarta or London, and whether this code runs in a
// browser or on Vercel's UTC servers.

const OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// days: 0 = Sunday ... 6 = Saturday. Change these to change the schedule
// everywhere (customer pages, admin pages, order validation).
export const SCHEDULES = {
  salad: { label: 'Salad Corner', days: [0, 1, 2, 3, 4], open: '12:00', close: '20:00' },
  coffee: { label: 'Coffee Corner', days: [1, 2, 3, 4, 5], open: '08:00', close: '16:00' },
}

export function jakartaParts(ms) {
  const d = new Date(ms + OFFSET_MS)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    dateKey: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    dow: d.getUTCDay(),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  }
}

// Midnight (00:00 WIB) at the start of the Jakarta day containing `ms`.
export function dayStartMs(ms) {
  return Math.floor((ms + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// override: { date: 'YYYY-MM-DD', state: 'open' | 'closed' } | null
// An admin override only counts on the date it was set, so a forgotten
// "close for today" fixes itself tomorrow without any cleanup job.
//   'closed' -> closed all day
//   'open'   -> waives the day-of-week rule (e.g. open on a Friday), but
//               the opening hours still apply
export function getCornerStatus(corner, nowMs, override) {
  const s = SCHEDULES[corner]
  const { dateKey, dow, minutes } = jakartaParts(nowMs)
  const today = override && override.date === dateKey ? override.state : null
  const base = { opens: s.open, closes: s.close }

  if (today === 'closed') return { ...base, isOpen: false, reason: 'override_closed' }
  if (!s.days.includes(dow) && today !== 'open') return { ...base, isOpen: false, reason: 'closed_day' }
  if (minutes < toMinutes(s.open) || minutes >= toMinutes(s.close)) {
    return { ...base, isOpen: false, reason: 'outside_hours' }
  }
  return { ...base, isOpen: true, reason: today === 'open' ? 'override_open' : 'open' }
}

function describeDays(days) {
  const sorted = [...days].sort((a, b) => a - b)
  const runs = []
  for (const d of sorted) {
    const last = runs[runs.length - 1]
    if (last && d === last[1] + 1) last[1] = d
    else runs.push([d, d])
  }
  return runs
    .map(([a, b]) => (a === b ? DAY_NAMES[a] : b === a + 1 ? `${DAY_NAMES[a]}, ${DAY_NAMES[b]}` : `${DAY_NAMES[a]}–${DAY_NAMES[b]}`))
    .join(', ')
}

export function describeSchedule(corner) {
  const s = SCHEDULES[corner]
  return `${describeDays(s.days)}, ${s.open}–${s.close}`
}

export function closedMessage(corner, status) {
  const label = SCHEDULES[corner].label
  const when = describeSchedule(corner)
  if (status.reason === 'override_closed') return `${label} is closed for today.`
  if (status.reason === 'closed_day') return `${label} is closed today. It opens ${when}.`
  return `${label} is closed right now. It opens ${when}.`
}
