// Builds the weekly Coffee Corner profit report that gets DMed to Ryn.
// Pure text-building (no I/O) so it can be tested.
import { BARISTA, BARISTA_RATE, UNASSIGNED, formatRp, weekLabel } from '../../shared/finance.js'

const pct = (n) => `${n.toFixed(1)}%`

function priceList(title, entries, costs) {
  if (entries.length === 0) return [`${title}: none`]
  const lines = entries.map((e) => {
    const c = costs[e.id]
    const capital = c ? formatRp(c.capital) : 'not set'
    const owner = c?.owner || 'not set'
    return `• ${e.name} — price ${formatRp(e.price)} · capital ${capital} · owner ${owner}`
  })
  return [`${title}:`, ...lines]
}

export function buildCoffeeWeeklyReport({ weekStart, summary: s, items, options, costs }) {
  const byName = (a, b) => a.name.localeCompare(b.name)
  const out = []

  out.push('**Coffee Corner — weekly profit report**')
  out.push(weekLabel(weekStart))
  out.push('')
  out.push('**Prices & capital (current)**')
  out.push(...priceList('Items', [...items].sort(byName), costs))
  out.push(...priceList('Options', [...options].sort(byName), costs))
  out.push('')
  out.push('**This week**')

  if (s.orders === 0) {
    out.push('No coffee orders this week.')
    return out.join('\n')
  }

  out.push(`Orders: ${s.orders}`)
  out.push(`Total money in: ${formatRp(s.revenue)} (unpaid so far: ${formatRp(s.unpaidRevenue)})`)
  out.push(`Total capital used: ${formatRp(s.capital)}`)
  const markup = s.markup === null ? '' : ` · ${pct(s.markup)} markup on capital`
  out.push(`Profit: ${formatRp(s.profit)} — ${pct(s.margin)} margin${markup}`)
  out.push('')
  out.push('**Shares** (money in, split by who owns each item/option)')

  for (const p of s.partners) {
    if (p.name === BARISTA) {
      out.push(
        `• ${p.name}: owner money ${formatRp(p.ownerMoney)} + barista pay ${formatRp(p.paycheck)} (${BARISTA_RATE * 100}% of profit) = ${formatRp(p.total)}`
      )
    } else {
      out.push(`• ${p.name}: ${formatRp(p.ownerMoney)}`)
    }
  }
  if (s.unassigned > 0) {
    out.push(`• ${UNASSIGNED} (no owner set when sold): ${formatRp(s.unassigned)}`)
  }
  if (s.mode === 'extra') {
    out.push('')
    out.push(`Barista pay is paid on top of the shares above (total payout ${formatRp(s.totalPayout)}).`)
  }
  return out.join('\n')
}
