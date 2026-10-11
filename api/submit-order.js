// The only way an order gets created. The browser sends WHAT was ordered
// (item ids, option ids, sauce id, name); placeOrder() checks the corner
// is open, prices everything from the menu in Firestore, verifies and
// decrements stock, snapshots the private capital/owner data and saves the
// order — all server-side, so none of it can be skipped or tampered with
// from a browser. Coffee orders then DM Vel and Ryn on Discord.
import { adminDb } from './_lib/firebaseAdmin.js'
import { OrderError } from './_lib/orderBuilder.js'
import { placeOrder, isCorner } from './_lib/placeOrder.js'
import { sendDiscordDMs } from './_lib/discord.js'
import { formatRp } from '../shared/finance.js'

function formatCoffeeMessage(order) {
  const lines = order.items.map((it) => {
    const extras = it.options.map((o) => o.name).join(', ')
    return `• ${it.name}${extras ? ` (${extras})` : ''} — ${formatRp(it.price)}`
  })
  return `**New Coffee Corner order** — ${order.customerName}\n${lines.join('\n')}\nTotal: ${formatRp(order.total)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, code: 'bad_method', error: 'Method not allowed' })
    return
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        throw new OrderError('bad_request', 'Invalid request.')
      }
    }
    const corner = body?.corner
    if (!isCorner(corner)) throw new OrderError('bad_request', 'Unknown corner.')

    const { orderId, order } = await placeOrder(adminDb, corner, body)

    if (corner === 'coffee') {
      try {
        await sendDiscordDMs([process.env.DISCORD_VEL_ID, process.env.DISCORD_RYN_ID], formatCoffeeMessage(order))
      } catch (err) {
        // The order is already saved; a Discord hiccup must never fail it.
        console.error('Coffee order DM failed:', err)
      }
    }

    res.status(200).json({ ok: true, orderId, total: order.total })
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.code === 'bad_request' ? 400 : 409
      res.status(status).json({ ok: false, code: err.code, error: err.message })
      return
    }
    console.error('submit-order failed:', err)
    res.status(500).json({ ok: false, code: 'server_error', error: 'Something went wrong on our side. Please try again.' })
  }
}
