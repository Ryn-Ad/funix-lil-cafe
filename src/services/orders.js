// Orders are created by the server (api/submit-order.js), not written to
// Firestore from the browser. This sends it what was picked and returns
// the confirmed total, or throws an Error whose message is safe to show.
export async function submitOrder(payload) {
  let res
  try {
    res = await fetch('/api/submit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.")
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // not JSON — handled below
  }

  if (!res.ok || !data?.ok) {
    if (import.meta.env.DEV && res.status === 404) {
      throw new Error('Orders go through the server. Run `vercel dev` instead of `npm run dev` to test them locally.')
    }
    throw new Error(data?.error || 'Could not submit your order. Please try again.')
  }
  return data
}
