import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const COLLECTIONS = { salad: 'saladOrders', coffee: 'coffeeOrders' }

// Live paid/unpaid status of ONE order, looked up by its id. Anyone who
// knows an order's (random, unguessable) id can read that single order —
// listing all orders stays admin-only (see firestore.rules).
//   exists: false -> an admin deleted the order
//   unknown: true -> couldn't look it up (offline, or rules not updated
//                    yet); the UI then simply shows no status
export function useOrderStatus(corner, orderId) {
  const [state, setState] = useState({ loading: true, exists: true, paid: false, unknown: false })

  useEffect(() => {
    const collection = COLLECTIONS[corner]
    if (!collection || !orderId) {
      setState({ loading: false, exists: true, paid: false, unknown: true })
      return undefined
    }
    return onSnapshot(
      doc(db, collection, orderId),
      (snap) => setState({ loading: false, exists: snap.exists(), paid: !!snap.data()?.paid, unknown: false }),
      () => setState({ loading: false, exists: true, paid: false, unknown: true })
    )
  }, [corner, orderId])

  return state
}
