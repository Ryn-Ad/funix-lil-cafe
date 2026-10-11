import test from 'node:test'
import assert from 'node:assert/strict'
import { placeOrder } from '../api/_lib/placeOrder.js'
import { OrderError } from '../api/_lib/orderBuilder.js'

// A tiny in-memory stand-in for the Firestore Admin SDK, supporting only
// what placeOrder() uses. Writes are applied only if the transaction
// callback finishes without throwing, like the real thing.
function makeFakeDb(initial) {
  const store = new Map(Object.entries(initial))
  let n = 0
  const ref = (path) => ({
    path,
    id: path.split('/').pop(),
    get: async () => ({ id: path.split('/').pop(), exists: store.has(path), data: () => store.get(path) }),
  })
  return {
    store,
    doc: ref,
    collection: (col) => ({ doc: (id) => ref(`${col}/${id ?? `auto${++n}`}`) }),
    async runTransaction(fn) {
      const writes = []
      const tx = {
        getAll: async (...refs) => Promise.all(refs.map((r) => r.get())),
        update: (r, patch) => writes.push(() => store.set(r.path, { ...store.get(r.path), ...patch })),
        set: (r, data) => writes.push(() => store.set(r.path, data)),
      }
      const result = await fn(tx)
      writes.forEach((w) => w())
      return result
    },
  }
}

// Monday 12 Oct 2026, 10:00 WIB (coffee open) / Sunday 11 Oct 13:00 WIB (salad open)
const MON_10AM = Date.UTC(2026, 9, 12, 3, 0)
const SUN_1PM = Date.UTC(2026, 9, 11, 6, 0)
const FRI_1PM = Date.UTC(2026, 9, 9, 6, 0)

const coffeeData = () => ({
  'coffeeItems/goodday': { name: 'GoodDay', price: 5000, category: 'coffee', hasOptions: true, stock: 3 },
  'coffeeItems/milo': { name: 'Milo', price: 4000, category: 'non-coffee', hasOptions: false, stock: null },
  'coffeeOptions/choc': { name: 'Chocolate', price: 1000 },
  'coffeeCosts/goodday': { capital: 2300, owner: 'Vel' },
  'coffeeCosts/choc': { capital: 400, owner: 'Ryn' },
})

test('coffee order: saves the order, a private financial record, and decrements stock', async () => {
  const db = makeFakeDb(coffeeData())
  const { orderId, order } = await placeOrder(
    db, 'coffee',
    { customerName: 'Andi', lines: [{ itemId: 'goodday', optionIds: ['choc'] }, { itemId: 'goodday', optionIds: [] }, { itemId: 'milo', optionIds: [] }] },
    MON_10AM
  )
  assert.equal(order.total, 6000 + 5000 + 4000)
  assert.equal(db.store.get('coffeeItems/goodday').stock, 1) // 3 - 2
  assert.equal(db.store.get('coffeeItems/milo').stock, null) // unlimited untouched

  const saved = db.store.get(`coffeeOrders/${orderId}`)
  assert.equal(saved.customerName, 'Andi')
  assert.equal(saved.paid, false)
  assert.ok(!('capital' in saved), 'capital must never be stored on the admin-readable order')

  const fin = db.store.get(`coffeeFinancials/${orderId}`)
  assert.equal(fin.revenue, 15000)
  assert.equal(fin.capital, 2300 + 400 + 2300)
  assert.deepEqual(fin.ownerRevenue, { Vel: 10000, Ryn: 1000, Unassigned: 4000 })
})

test('refuses an order that exceeds stock, and writes nothing', async () => {
  const db = makeFakeDb(coffeeData())
  const lines = Array(4).fill({ itemId: 'goodday', optionIds: [] })
  await assert.rejects(placeOrder(db, 'coffee', { customerName: 'Andi', lines }, MON_10AM), /only has 3 left/)
  assert.equal(db.store.get('coffeeItems/goodday').stock, 3)
  assert.equal([...db.store.keys()].filter((k) => k.startsWith('coffeeOrders/')).length, 0)
})

test('refuses orders outside opening hours and on closed days', async () => {
  const db = makeFakeDb(coffeeData())
  const body = { customerName: 'Andi', lines: [{ itemId: 'milo', optionIds: [] }] }
  const SAT = Date.UTC(2026, 9, 10, 3, 0)
  await assert.rejects(placeOrder(db, 'coffee', body, SAT), (e) => e instanceof OrderError && e.code === 'closed')
  const MON_5PM = Date.UTC(2026, 9, 12, 10, 0)
  await assert.rejects(placeOrder(db, 'coffee', body, MON_5PM), (e) => e.code === 'closed')
})

test("an admin's same-day 'closed' override is respected by the server", async () => {
  const db = makeFakeDb({ ...coffeeData(), 'settings/coffeeCorner': { override: { date: '2026-10-12', state: 'closed' } } })
  const body = { customerName: 'Andi', lines: [{ itemId: 'milo', optionIds: [] }] }
  await assert.rejects(placeOrder(db, 'coffee', body, MON_10AM), (e) => e.code === 'closed')
})

test('salad order: Sunday open, Friday closed, sauce stored by name, stock decremented', async () => {
  const data = {
    'saladItems/s1': { name: 'Garden Salad', price: 15000, category: 'salad', stock: 2 },
    'saladSauces/caesar': { name: 'Caesar' },
  }
  const db = makeFakeDb(data)
  const body = { customerName: 'Budi', lines: [{ itemId: 's1', sauceId: 'caesar' }] }

  const { orderId, order } = await placeOrder(db, 'salad', body, SUN_1PM)
  assert.equal(order.items[0].sauce, 'Caesar')
  assert.equal(db.store.get('saladItems/s1').stock, 1)
  assert.ok(db.store.has(`saladOrders/${orderId}`))
  assert.ok(![...db.store.keys()].some((k) => k.startsWith('coffeeFinancials/')))

  await assert.rejects(placeOrder(db, 'salad', body, FRI_1PM), (e) => e.code === 'closed')
})

test('a price sent by the browser is ignored', async () => {
  const db = makeFakeDb(coffeeData())
  const { order } = await placeOrder(
    db, 'coffee',
    { customerName: 'Andi', lines: [{ itemId: 'milo', optionIds: [], price: 1 }] },
    MON_10AM
  )
  assert.equal(order.total, 4000)
})

test('rejects malformed ids instead of reaching into other documents', async () => {
  const db = makeFakeDb(coffeeData())
  await assert.rejects(
    placeOrder(db, 'coffee', { customerName: 'Andi', lines: [{ itemId: '../settings/x', optionIds: [] }] }, MON_10AM),
    OrderError
  )
})
