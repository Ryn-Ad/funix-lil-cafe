// Weekly profit maths, shared by the Profit tab (browser) and the weekly
// Discord report (serverless). One implementation, so the two can never
// disagree about a number.

export const PARTNERS = ['Ryn', 'Vel', 'Cima', 'Jane']
export const UNASSIGNED = 'Unassigned' // sold before an owner was set
export const BARISTA = 'Ryn'
export const BARISTA_RATE = 0.2 // 20% of the week's profit

// How the barista paycheck is funded:
//  'extra'  -> paid ON TOP of every owner's full share, exactly as
//              described: owner money + barista paycheck. Total payouts
//              then exceed the week's revenue by the paycheck.
//  'shared' -> the paycheck is taken out of the owners' shares in
//              proportion to the profit each owner's items made, so the
//              payouts add up to exactly the money collected.
export const BARISTA_PAY_MODE = 'extra'

const OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatRp = (n) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`

// Monday 00:00 (Jakarta time) of the week containing `ms`.
export function weekStartMs(ms) {
  const shifted = ms + OFFSET_MS
  const dayIndex = Math.floor(shifted / DAY_MS)
  const dow = new Date(shifted).getUTCDay() // 0 = Sunday
  const sinceMonday = (dow + 6) % 7
  return (dayIndex - sinceMonday) * DAY_MS - OFFSET_MS
}

function shortDate(ms) {
  const d = new Date(ms + OFFSET_MS)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function weekLabel(startMs) {
  return `Mon ${shortDate(startMs)} – Sun ${shortDate(startMs + 6 * DAY_MS)}`
}

// records: [{ submittedAt, ... }] -> [{ key, label, records }], newest week first
export function groupByWeek(records) {
  const groups = new Map()
  for (const r of records) {
    const key = weekStartMs(r.submittedAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([key, recs]) => ({ key, label: weekLabel(key), records: recs }))
}

const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0)

function addMaps(records, field) {
  const out = {}
  for (const r of records) {
    for (const [owner, value] of Object.entries(r[field] || {})) {
      out[owner] = (out[owner] || 0) + (Number(value) || 0)
    }
  }
  return out
}

// records: [{ revenue, capital, paid, ownerRevenue, ownerCapital }]
export function summarizeWeek(records, mode = BARISTA_PAY_MODE) {
  const revenue = sum(records, (r) => r.revenue)
  const capital = sum(records, (r) => r.capital)
  const paidRevenue = sum(records.filter((r) => r.paid), (r) => r.revenue)
  const profit = revenue - capital
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  const markup = capital > 0 ? (profit / capital) * 100 : null

  const ownerRevenue = addMaps(records, 'ownerRevenue')
  const ownerCapital = addMaps(records, 'ownerCapital')
  const baristaPay = profit > 0 ? Math.round(profit * BARISTA_RATE) : 0

  // 'shared' mode: split the paycheck across partners by the profit their
  // items made. Floor each share, then give the leftover rupiah to the
  // biggest contributor so the pieces add up exactly.
  const deductions = {}
  if (mode === 'shared' && baristaPay > 0) {
    const contribution = {}
    for (const p of PARTNERS) {
      contribution[p] = Math.max(0, (ownerRevenue[p] || 0) - (ownerCapital[p] || 0))
    }
    const totalContribution = sum(PARTNERS, (p) => contribution[p])
    if (totalContribution > 0) {
      let allocated = 0
      for (const p of PARTNERS) {
        deductions[p] = Math.floor((baristaPay * contribution[p]) / totalContribution)
        allocated += deductions[p]
      }
      const biggest = [...PARTNERS].sort((a, b) => contribution[b] - contribution[a])[0]
      deductions[biggest] += baristaPay - allocated
    }
  }

  const partners = PARTNERS.map((name) => {
    const revenueShare = ownerRevenue[name] || 0
    const deduction = deductions[name] || 0
    const ownerMoney = revenueShare - deduction
    const paycheck = name === BARISTA ? baristaPay : 0
    return { name, revenueShare, deduction, ownerMoney, paycheck, total: ownerMoney + paycheck }
  })
  const unassigned = ownerRevenue[UNASSIGNED] || 0

  return {
    mode,
    orders: records.length,
    revenue,
    paidRevenue,
    unpaidRevenue: revenue - paidRevenue,
    capital,
    profit,
    margin,
    markup,
    baristaPay,
    partners,
    unassigned,
    totalPayout: sum(partners, (p) => p.total) + unassigned,
  }
}
