// The database half of order submission, kept free of any Firebase
// import so tests can run it against an in-memory fake (tests/placeOrder.test.js).
// `db` is the Admin SDK's Firestore instance in production.
import { getCornerStatus, closedMessage } from '../../shared/schedule.js'
import { OrderError, buildSaladOrder, buildCoffeeOrder, checkStock, isSafeId } from './orderBuilder.js'

const CORNERS = {
  salad: { itemsCol: 'saladItems', ordersCol: 'saladOrders', settingsDoc: 'settings/saladCorner' },
  coffee: { itemsCol: 'coffeeItems', ordersCol: 'coffeeOrders', settingsDoc: 'settings/coffeeCorner' },
}
export const isCorner = (corner) => Object.hasOwn(CORNERS, corner)

const unique = (list) => [...new Set(list)]
const toMap = (snaps) => Object.fromEntries(snaps.filter((s) => s.exists).map((s) => [s.id, { id: s.id, ...s.data() }]))

export async function placeOrder(db, corner, body, now = Date.now()) {
  const cfg = CORNERS[corner]

  const settings = await db.doc(cfg.settingsDoc).get()
  const status = getCornerStatus(corner, now, settings.data()?.override)
  if (!status.isOpen) throw new OrderError('closed', closedMessage(corner, status))

  const lines = Array.isArray(body.lines) ? body.lines : []
  const itemIds = unique(lines.map((l) => l?.itemId).filter(isSafeId))
  const optionIds = unique(lines.flatMap((l) => (Array.isArray(l?.optionIds) ? l.optionIds : [])).filter(isSafeId))
  const sauceIds = unique(lines.map((l) => l?.sauceId).filter(isSafeId))
  const orderRef = db.collection(cfg.ordersCol).doc()

  return db.runTransaction(async (tx) => {
    const ref = (col, id) => db.collection(col).doc(id)

    // All reads first (Firestore requires reads before writes in a transaction).
    const itemRefs = itemIds.map((id) => ref(cfg.itemsCol, id))
    const extraRefs =
      corner === 'coffee'
        ? [
            ...optionIds.map((id) => ref('coffeeOptions', id)),
            ...itemIds.map((id) => ref('coffeeCosts', id)),
            ...optionIds.map((id) => ref('coffeeCosts', id)),
          ]
        : sauceIds.map((id) => ref('saladSauces', id))
    const allRefs = [...itemRefs, ...extraRefs]
    const snaps = allRefs.length ? await tx.getAll(...allRefs) : []

    const items = toMap(snaps.slice(0, itemRefs.length))
    let built

    if (corner === 'salad') {
      const sauces = toMap(snaps.slice(itemRefs.length))
      built = buildSaladOrder({ customerName: body.customerName, lines, items, sauces, now })
    } else {
      const optionSnaps = snaps.slice(itemRefs.length, itemRefs.length + optionIds.length)
      const costSnaps = snaps.slice(itemRefs.length + optionIds.length)
      built = buildCoffeeOrder({
        customerName: body.customerName,
        lines,
        items,
        options: toMap(optionSnaps),
        costs: toMap(costSnaps),
        now,
      })
    }

    checkStock(built.stockNeeds, items)

    for (const [id, need] of Object.entries(built.stockNeeds)) {
      if (typeof items[id].stock === 'number') {
        tx.update(ref(cfg.itemsCol, id), { stock: items[id].stock - need })
      }
    }
    tx.set(orderRef, built.order)
    if (built.financial) tx.set(db.collection('coffeeFinancials').doc(orderRef.id), built.financial)

    return { orderId: orderRef.id, order: built.order }
  })
}

