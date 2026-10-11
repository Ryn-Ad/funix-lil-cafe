// Pure order-building logic: takes what the customer asked for plus the
// current menu (from Firestore) and returns the order to save. Contains
// no database calls, so it can be unit-tested (see tests/).
//
// The server recomputes every price from the menu — it never trusts the
// prices the browser shows — and snapshots capital/owner at order time,
// so editing a capital later never rewrites past weeks' profit.
import { PARTNERS, UNASSIGNED } from '../../shared/finance.js'

export class OrderError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const MAX_LINES = 20
const MAX_OPTIONS_PER_LINE = 10

export function isSafeId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(id)
}

function cleanName(raw) {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  if (!name || name.length > 40) throw new OrderError('bad_request', 'Your name must be 1–40 characters.')
  return name
}

function checkLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) throw new OrderError('bad_request', 'Your cart is empty.')
  if (lines.length > MAX_LINES) throw new OrderError('bad_request', `Please keep orders to ${MAX_LINES} items or fewer.`)
  for (const line of lines) {
    if (!line || !isSafeId(line.itemId)) throw new OrderError('bad_request', 'Invalid item in your cart.')
  }
}

function countNeeds(lines) {
  const needs = {}
  for (const line of lines) needs[line.itemId] = (needs[line.itemId] || 0) + 1
  return needs
}

function price(value, label) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) throw new OrderError('server_error', `${label} has an invalid price.`)
  return n
}

export function buildSaladOrder({ customerName, lines, items, sauces, now }) {
  const name = cleanName(customerName)
  checkLines(lines)

  const orderItems = lines.map((line) => {
    const item = items[line.itemId]
    if (!item) throw new OrderError('unknown_item', 'An item in your cart is no longer on the menu.')
    let sauce = null
    if (item.category === 'salad') {
      const found = sauces[line.sauceId]
      if (!found) throw new OrderError('bad_request', `Please pick a sauce for ${item.name}.`)
      sauce = found.name
    }
    return { itemId: item.id, name: item.name, sauce, price: price(item.price, item.name) }
  })

  const total = orderItems.reduce((t, it) => t + it.price, 0)
  return {
    order: { customerName: name, items: orderItems, paid: false, submittedAt: now, total },
    stockNeeds: countNeeds(lines),
  }
}

function costOf(costs, id) {
  const doc = costs[id]
  return {
    capital: Math.max(0, Number(doc?.capital) || 0),
    owner: PARTNERS.includes(doc?.owner) ? doc.owner : UNASSIGNED,
  }
}

export function buildCoffeeOrder({ customerName, lines, items, options, costs, now }) {
  const name = cleanName(customerName)
  checkLines(lines)

  const ownerRevenue = {}
  const ownerCapital = {}
  const credit = (owner, revenue, capital) => {
    ownerRevenue[owner] = (ownerRevenue[owner] || 0) + revenue
    ownerCapital[owner] = (ownerCapital[owner] || 0) + capital
  }

  let totalCapital = 0
  const orderItems = []
  const financialLines = []

  for (const line of lines) {
    const item = items[line.itemId]
    if (!item) throw new OrderError('unknown_item', 'An item in your cart is no longer on the menu.')

    const optionIds = [...new Set(Array.isArray(line.optionIds) ? line.optionIds : [])]
    if (optionIds.length > MAX_OPTIONS_PER_LINE) throw new OrderError('bad_request', 'Too many options on one item.')
    if (optionIds.length > 0 && !item.hasOptions) {
      throw new OrderError('bad_request', `${item.name} doesn't take any options.`)
    }

    const itemCost = costOf(costs, item.id)
    const itemPrice = price(item.price, item.name)
    credit(itemCost.owner, itemPrice, itemCost.capital)
    let lineTotal = itemPrice
    let lineCapital = itemCost.capital

    const chosen = optionIds.map((id) => {
      const option = isSafeId(id) ? options[id] : null
      if (!option) throw new OrderError('unknown_item', 'An option in your cart is no longer available.')
      const optionPrice = price(option.price, option.name)
      const optionCost = costOf(costs, option.id)
      credit(optionCost.owner, optionPrice, optionCost.capital)
      lineTotal += optionPrice
      lineCapital += optionCost.capital
      return { id: option.id, name: option.name, price: optionPrice }
    })

    totalCapital += lineCapital
    orderItems.push({ itemId: item.id, name: item.name, options: chosen, price: lineTotal })
    financialLines.push({ itemId: item.id, optionIds, price: lineTotal, capital: lineCapital })
  }

  const total = orderItems.reduce((t, it) => t + it.price, 0)
  return {
    order: { customerName: name, items: orderItems, paid: false, submittedAt: now, total },
    // Kept in a separate, owner-only document so capital and owners are
    // never visible to the coffee admin or anyone else (see firestore.rules).
    financial: {
      submittedAt: now,
      revenue: total,
      capital: totalCapital,
      ownerRevenue,
      ownerCapital,
      lines: financialLines,
    },
    stockNeeds: countNeeds(lines),
  }
}

// Throws if any needed item has tracked stock that can't cover the order.
export function checkStock(stockNeeds, items) {
  for (const [id, need] of Object.entries(stockNeeds)) {
    const stock = items[id]?.stock
    if (typeof stock === 'number' && stock < need) {
      const left = stock <= 0 ? 'is out of stock' : `only has ${stock} left`
      throw new OrderError('out_of_stock', `${items[id].name} ${left}.`)
    }
  }
}
