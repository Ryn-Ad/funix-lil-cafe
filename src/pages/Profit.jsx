import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useCollection } from '../services/localStore'
import SectionDivider from '../components/SectionDivider'
import {
  PARTNERS,
  UNASSIGNED,
  BARISTA,
  BARISTA_RATE,
  groupByWeek,
  summarizeWeek,
  formatRp,
} from '../../shared/finance.js'

const pct = (n) => `${n.toFixed(1)}%`

function Stat({ label, value, sub }) {
  return (
    <div>
      <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function WeekCard({ week }) {
  const s = summarizeWeek(week.records)
  const markup = s.markup === null ? '' : ` · ${s.markup.toFixed(0)}% markup`

  return (
    <div className="card p-5 mb-4">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Stat label="Money got: " value={formatRp(s.revenue)} sub={`${formatRp(s.unpaidRevenue)} not paid yet`} />
        <Stat label="Capital used: " value={formatRp(s.capital)} />
        <Stat
          label="Profit"
          value={formatRp(s.profit)}
          sub={`${pct(s.margin)} Margin: ${markup}`}
        />
        <Stat label="Orders" value={s.orders} />
      </div>

      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>
        Shares of the money got:
      </p>
      <div className="flex flex-col gap-2">
        {s.partners.map((p) => (
          <div
            key={p.name}
            className="flex items-start justify-between gap-3 pb-2"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div>
              <p className="text-sm">{p.name}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                Owner money:  {formatRp(p.ownerMoney)}
                {p.deduction > 0 && ` (after ${formatRp(p.deduction)} barista deduction)`}
                {p.name === BARISTA && ` + Barista pay ${formatRp(p.paycheck)}`}
              </p>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
              {formatRp(p.total)}
            </p>
          </div>
        ))}
        {s.unassigned > 0 && (
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-danger)' }}>
            <span>{UNASSIGNED} (sold before an owner was set)</span>
            <span>{formatRp(s.unassigned)}</span>
          </div>
        )}
      </div>
      {s.mode === 'extra' && (
        <p className="text-[11px] mt-3" style={{ color: 'var(--color-muted)' }}>
          {BARISTA} is paid {BARISTA_RATE * 100}% of profit as barista on top of the shares above, so total payout is{' '}
          {formatRp(s.totalPayout)}.
        </p>
      )}
    </div>
  )
}

function CostRow({ entry, saved, onSave }) {
  const [capital, setCapital] = useState(saved ? String(saved.capital) : '')
  const [owner, setOwner] = useState(saved?.owner || '')
  const dirty = capital !== (saved ? String(saved.capital) : '') || owner !== (saved?.owner || '')
  const ready = capital !== '' && Number(capital) >= 0 && owner !== ''
  const margin = capital !== '' ? entry.price - Number(capital) : null

  return (
    <div className="flex flex-col gap-2 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{entry.name}</p>
        <p className="text-[11px] shrink-0" style={{ color: 'var(--color-muted)' }}>
          price {formatRp(entry.price)}
          {margin !== null && ` · margin ${formatRp(margin)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          className="input-field px-3 py-2 text-xs flex-1 min-w-0"
          placeholder="Capital (Rp)"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />
        <select className="input-field px-3 py-2 text-xs" value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">owner…</option>
          {PARTNERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          disabled={!dirty || !ready}
          onClick={() => onSave(entry, { capital: Number(capital), owner })}
          className="btn-primary text-xs px-3 py-2"
          style={!dirty || !ready ? { opacity: 0.4 } : undefined}
        >
          save
        </button>
      </div>
    </div>
  )
}

function CostsEditor({ items, options, costs }) {
  const costById = useMemo(() => Object.fromEntries(costs.items.map((c) => [c.id, c])), [costs.items])
  const byName = (a, b) => a.name.localeCompare(b.name)
  const sortedItems = [...items].sort(byName)
  const sortedOptions = [...options].sort(byName)
  const missing = [...sortedItems, ...sortedOptions].filter((e) => !costById[e.id])

  const save = (entry, data) => costs.set(entry.id, { ...data, name: entry.name })

  return (
    <>
      {missing.length > 0 && (
        <div
          className="card p-4 mb-4 flex gap-3 text-xs"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <p>
            {missing.length} item{missing.length === 1 ? '' : 's'}/option{missing.length === 1 ? '' : 's'} still
            ha{missing.length === 1 ? 's' : 've'} no capital or owner ({missing.map((m) => m.name).join(', ')}). Orders
            placed before this is set are counted with zero capital and no owner, so set it first.
          </p>
        </div>
      )}
      <p className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
        Capital is what one unit costs you. Changing it only affects future orders &mdash; past weeks keep the capital
        they were sold with.
      </p>
      <SectionDivider label="coffee items" />
      {sortedItems.map((e) => (
        <CostRow key={`${e.id}:${costById[e.id]?.capital}:${costById[e.id]?.owner}`} entry={e} saved={costById[e.id]} onSave={save} />
      ))}
      <SectionDivider label="options" />
      {sortedOptions.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          No options yet &mdash; add them from the Coffee Corner page.
        </p>
      )}
      {sortedOptions.map((e) => (
        <CostRow key={`${e.id}:${costById[e.id]?.capital}:${costById[e.id]?.owner}`} entry={e} saved={costById[e.id]} onSave={save} />
      ))}
    </>
  )
}

export default function Profit() {
  const [tab, setTab] = useState('weekly')
  const financials = useCollection('coffeeFinancials')
  const orders = useCollection('coffeeOrders')
  const items = useCollection('coffeeItems')
  const options = useCollection('coffeeOptions')
  const costs = useCollection('coffeeCosts')

  const loading = financials.loading || orders.loading

  // Join each private financial record to its order: that gives us the
  // paid flag, and an order an admin deleted drops out of the totals.
  const weeks = useMemo(() => {
    const orderById = Object.fromEntries(orders.items.map((o) => [o.id, o]))
    const records = financials.items.filter((f) => orderById[f.id]).map((f) => ({ ...f, paid: !!orderById[f.id].paid }))
    return groupByWeek(records)
  }, [financials.items, orders.items])

  const tabButton = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className="pill text-xs px-4 py-1.5 border"
      style={{
        borderColor: tab === id ? 'var(--color-accent)' : 'var(--color-border)',
        backgroundColor: tab === id ? 'var(--color-accent-soft)' : 'transparent',
        color: tab === id ? 'var(--color-accent)' : 'var(--color-muted)',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
      <h1 className="text-xl font-semibold">Profit</h1>
      <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-muted)' }}>
        Coffee Corner only &mdash; visible to you only
      </p>
      <div className="flex gap-2 mb-5">
        {tabButton('weekly', 'weekly profit')}
        {tabButton('costs', 'capital & owners')}
      </div>

      {tab === 'costs' ? (
        <CostsEditor items={items.items} options={options.items} costs={costs} />
      ) : loading ? (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Loading&hellip;
        </p>
      ) : weeks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          No coffee sales recorded yet.
        </p>
      ) : (
        weeks.map((week) => (
          <div key={week.key}>
            <SectionDivider label={week.label} />
            <WeekCard week={week} />
          </div>
        ))
      )}
    </div>
  )
}
