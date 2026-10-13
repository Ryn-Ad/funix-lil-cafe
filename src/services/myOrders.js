import { useCallback, useState } from 'react'

// Customers have no account, so their order history is a receipt kept in
// THIS browser (localStorage) — the same approach as the saved name.
// The receipt holds only what the customer already saw; the live paid
// status is looked up from Firestore by the order's id (see
// hooks/useOrderStatus.js).
//
// Limits worth knowing: clearing site data or switching phone loses the
// list, and receipts expire after 14 days or beyond the latest 20.
const KEY = 'cafe_my_orders'
const MAX_ORDERS = 20
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

function isReceipt(r) {
  return r && typeof r.id === 'string' && typeof r.submittedAt === 'number' && Array.isArray(r.lines)
}

export function loadReceipts(now = Date.now()) {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => isReceipt(r) && now - r.submittedAt < MAX_AGE_MS)
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, MAX_ORDERS)
  } catch {
    return [] // corrupted data or storage blocked (private mode): start empty
  }
}

function persist(receipts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(receipts))
  } catch {
    // storage full or blocked — the order itself is already saved on the
    // server, we just can't remember it on this device
  }
}

export function useMyOrders(customerName) {
  const [all, setAll] = useState(() => loadReceipts())

  const add = useCallback((receipt) => {
    const next = [receipt, ...loadReceipts().filter((r) => r.id !== receipt.id)].slice(0, MAX_ORDERS)
    persist(next)
    setAll(next)
  }, [])

  const forget = useCallback((id) => {
    const next = loadReceipts().filter((r) => r.id !== id)
    persist(next)
    setAll(next)
  }, [])

  // On a shared device, only show receipts for the name currently signed in.
  const mine = all.filter((r) => (r.customerName || '').toLowerCase() === (customerName || '').toLowerCase())
  return { orders: mine, add, forget }
}
