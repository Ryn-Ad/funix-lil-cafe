// Runs Sunday–Thursday at 20:00 Asia/Jakarta (see vercel.json). The
// corner itself closes by the clock (shared/schedule.js) — this job only
// DMs the day's order list to Zac and Ryn so Zac can start prepping.
import { adminDb } from '../_lib/firebaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { sendDiscordDMs } from '../_lib/discord.js'
import { dayStartMs } from '../../shared/schedule.js'
import { formatRp } from '../../shared/finance.js'

function formatOrders(orders) {
  if (orders.length === 0) return 'No salad orders came in today.'
  const lines = orders.map((o) => {
    const items = (o.items || []).map((it) => `${it.name}${it.sauce ? ` (${it.sauce})` : ''}`).join(', ')
    return `• ${o.customerName}: ${items} — ${formatRp(o.total)}`
  })
  const grandTotal = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  return `${lines.join('\n')}\n\nTotal: ${formatRp(grandTotal)} (${orders.length} order${orders.length === 1 ? '' : 's'})`
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const start = dayStartMs(Date.now())
    const snapshot = await adminDb.collection('saladOrders').where('submittedAt', '>=', start).get()
    const orders = snapshot.docs.map((d) => d.data()).sort((a, b) => a.submittedAt - b.submittedAt)

    await sendDiscordDMs(
      [process.env.DISCORD_ZAC_ID, process.env.DISCORD_RYN_ID],
      `**Salad Corner closed for today**\n${formatOrders(orders)}`
    )
    res.status(200).json({ ok: true, orderCount: orders.length })
  } catch (err) {
    console.error('close-salad cron failed:', err)
    res.status(500).json({ ok: false })
  }
}
