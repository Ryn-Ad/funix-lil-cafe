// Called by the client (src/pages/Cart.jsx) right after a coffee order
// is written to Firestore. Sends a Discord DM to Vel and Ryn.
//
// Trusts the order data the client sends rather than re-reading it from
// Firestore — simpler, and the worst case of someone forging a fake
// request here is a prank DM, not lost money or data (the real order
// already lives safely in Firestore before this is ever called).
import { sendDiscordDMs } from './_lib/discord.js'

const RECIPIENTS = [process.env.DISCORD_VEL_ID, process.env.DISCORD_RYN_ID]

function formatOrder(body) {
  const lines = (body.items || [])
    .map((it) => {
      const extras = it.options
        ? Object.entries(it.options)
            .filter(([, on]) => on)
            .map(([key]) => key)
            .join(', ')
        : ''
      return `• ${it.name}${extras ? ` (${extras})` : ''} — Rp ${Number(it.price || 0).toLocaleString('id-ID')}`
    })
    .join('\n')
  const total = Number(body.total || 0).toLocaleString('id-ID')
  return `**New Coffee Corner order** — ${body.customerName}\n${lines}\nTotal: Rp ${total}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!body?.customerName || !Array.isArray(body.items)) {
      res.status(400).json({ error: 'Invalid order payload' })
      return
    }
    await sendDiscordDMs(RECIPIENTS, formatOrder(body))
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('notify-coffee-order failed:', err)
    // Still 200: a notification failure is never the customer's problem
    // to see — their order already succeeded before this ran.
    res.status(200).json({ ok: false })
  }
}
