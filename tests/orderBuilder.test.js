import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCoffeeOrder, buildSaladOrder, checkStock, OrderError } from '../api/_lib/orderBuilder.js'
import { summarizeWeek } from '../shared/finance.js'

const items = {
  goodday: { id: 'goodday', name: 'GoodDay Mocaccino', price: 5000, hasOptions: true, stock: 10 },
  nescafe: { id: 'nescafe', name: 'Nescafe Ice Roast', price: 6000, hasOptions: true, stock: null },
  milo: { id: 'milo', name: 'Milo', price: 4000, hasOptions: false, stock: 2 },
}
const options = {
  choc: { id: 'choc', name: 'Chocolate', price: 1000 },
  milk: { id: 'milk', name: 'Milk', price: 3000 },
}
const costs = {
  goodday: { capital: 2300, owner: 'Vel' },
  nescafe: { capital: 2500, owner: 'Cima' },
  choc: { capital: 400, owner: 'Ryn' },
  milk: { capital: 2100, owner: 'Ryn' },
}
const now = 1760000000000

test("spec example: GoodDay x5 (2 with chocolate) + Nescafe x3 (1 with chocolate)", () => {
  const lines = [
    ...Array(3).fill({ itemId: 'goodday', optionIds: [] }),
    ...Array(2).fill({ itemId: 'goodday', optionIds: ['choc'] }),
    ...Array(2).fill({ itemId: 'nescafe', optionIds: [] }),
    { itemId: 'nescafe', optionIds: ['choc'] },
  ]
  const { order, financial, stockNeeds } = buildCoffeeOrder({ customerName: 'Andi', lines, items, options, costs, now })

  assert.equal(financial.ownerRevenue.Vel, 5000 * 5) // GoodDay price x 5
  assert.equal(financial.ownerRevenue.Ryn, 1000 * 3) // Chocolate price x 3
  assert.equal(financial.ownerRevenue.Cima, 6000 * 3)
  assert.equal(order.total, 25000 + 18000 + 3000)
  assert.equal(financial.capital, 2300 * 5 + 2500 * 3 + 400 * 3)
  assert.deepEqual(stockNeeds, { goodday: 5, nescafe: 3 })

  // and the weekly maths agrees with the order
  const week = summarizeWeek([{ ...financial, paid: true }])
  assert.equal(week.revenue, order.total)
  assert.equal(week.profit, order.total - financial.capital)
})

test('prices come from the menu, never from the browser', () => {
  const { order } = buildCoffeeOrder({
    customerName: 'Andi',
    lines: [{ itemId: 'goodday', optionIds: [], price: 1 }],
    items, options, costs, now,
  })
  assert.equal(order.total, 5000)
})

test('items or options with no capital/owner set are flagged as Unassigned, not lost', () => {
  const { financial } = buildCoffeeOrder({
    customerName: 'Andi', lines: [{ itemId: 'milo', optionIds: [] }], items, options, costs, now,
  })
  assert.equal(financial.ownerRevenue.Unassigned, 4000)
  assert.equal(financial.capital, 0)
})

test('rejects options on an item that has none, unknown items and empty carts', () => {
  const build = (lines) => () => buildCoffeeOrder({ customerName: 'A', lines, items, options, costs, now })
  assert.throws(build([{ itemId: 'milo', optionIds: ['choc'] }]), OrderError)
  assert.throws(build([{ itemId: 'ghost', optionIds: [] }]), OrderError)
  assert.throws(build([]), OrderError)
  assert.throws(build([{ itemId: 'goodday', optionIds: ['ghost'] }]), OrderError)
})

test('stock: refuses orders that exceed what is left', () => {
  const need = { milo: 3 }
  assert.throws(() => checkStock(need, items), /only has 2 left/)
  assert.doesNotThrow(() => checkStock({ nescafe: 99 }, items)) // unlimited
  assert.throws(() => checkStock({ milo: 1 }, { milo: { ...items.milo, stock: 0 } }), /out of stock/)
})

test('salad: a salad needs a sauce, a snack does not', () => {
  const saladItems = {
    s1: { id: 's1', name: 'Garden Salad', price: 15000, category: 'salad' },
    k1: { id: 'k1', name: 'Wonton', price: 8000, category: 'snack' },
  }
  const sauces = { caesar: { id: 'caesar', name: 'Caesar' } }
  const ok = buildSaladOrder({
    customerName: 'Budi', lines: [{ itemId: 's1', sauceId: 'caesar' }, { itemId: 'k1' }], items: saladItems, sauces, now,
  })
  assert.equal(ok.order.total, 23000)
  assert.equal(ok.order.items[0].sauce, 'Caesar')
  assert.throws(
    () => buildSaladOrder({ customerName: 'Budi', lines: [{ itemId: 's1' }], items: saladItems, sauces, now }),
    /pick a sauce/
  )
})

test('names are validated', () => {
  const lines = [{ itemId: 'milo', optionIds: [] }]
  assert.throws(() => buildCoffeeOrder({ customerName: '   ', lines, items, options, costs, now }), OrderError)
  assert.throws(() => buildCoffeeOrder({ customerName: 'x'.repeat(41), lines, items, options, costs, now }), OrderError)
})
