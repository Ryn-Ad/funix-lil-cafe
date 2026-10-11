import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeWeek, weekStartMs, weekLabel, groupByWeek } from '../shared/finance.js'

// The example from the spec: money in 50.000, capital 15.000 -> profit
// 35.000 -> barista (Ryn) gets 20% = 7.000.
const week = [
  {
    revenue: 50000,
    capital: 15000,
    paid: true,
    ownerRevenue: { Vel: 25000, Ryn: 3000, Cima: 12000, Jane: 10000 },
    ownerCapital: { Vel: 10000, Ryn: 600, Cima: 2400, Jane: 2000 },
  },
]

test('profit, margin and barista pay match the worked example', () => {
  const s = summarizeWeek(week)
  assert.equal(s.profit, 35000)
  assert.equal(s.baristaPay, 7000)
  assert.equal(Math.round(s.margin), 70)
  assert.equal(Math.round(s.markup), 233)
})

test("'extra' mode: Ryn gets owner money plus paycheck, others get their share", () => {
  const s = summarizeWeek(week, 'extra')
  const ryn = s.partners.find((p) => p.name === 'Ryn')
  assert.equal(ryn.ownerMoney, 3000)
  assert.equal(ryn.paycheck, 7000)
  assert.equal(ryn.total, 10000)
  assert.equal(s.partners.find((p) => p.name === 'Vel').total, 25000)
  assert.equal(s.totalPayout, 57000) // revenue + paycheck, by design
})

test("'shared' mode: payouts add up to exactly the money collected", () => {
  const s = summarizeWeek(week, 'shared')
  assert.equal(s.totalPayout, 50000)
  assert.equal(s.baristaPay, 7000)
})

test('a losing week pays no barista bonus', () => {
  const s = summarizeWeek([{ revenue: 10000, capital: 12000, ownerRevenue: { Vel: 10000 }, ownerCapital: { Vel: 12000 } }])
  assert.equal(s.profit, -2000)
  assert.equal(s.baristaPay, 0)
})

test('empty week does not divide by zero', () => {
  const s = summarizeWeek([])
  assert.equal(s.margin, 0)
  assert.equal(s.markup, null)
  assert.equal(s.revenue, 0)
})

test('weeks start on Monday in Jakarta time', () => {
  // Sunday 11 Oct 2026 23:30 WIB is still the week of Monday 5 Oct
  const sundayNight = Date.UTC(2026, 9, 11, 16, 30)
  assert.equal(weekLabel(weekStartMs(sundayNight)), 'Mon 5 Oct – Sun 11 Oct')
  // One hour later it is Monday 12 Oct 00:30 WIB -> next week
  assert.equal(weekLabel(weekStartMs(sundayNight + 60 * 60 * 1000)), 'Mon 12 Oct – Sun 18 Oct')
})

test('groupByWeek puts newest week first', () => {
  const groups = groupByWeek([{ submittedAt: Date.UTC(2026, 9, 1) }, { submittedAt: Date.UTC(2026, 9, 14) }])
  assert.equal(groups.length, 2)
  assert.ok(groups[0].key > groups[1].key)
})
