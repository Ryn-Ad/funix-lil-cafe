// Triggered daily by Vercel Cron (see vercel.json) at 20:00 Asia/Jakarta
// time. Closes the Salad Corner and DMs the day's order list to Zac and
// Ryn on Discord — so Zac can start prepping without opening the app.
import { adminDb } from '../_lib/firebaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { sendDiscordDMs } from '../_lib/discord.js'

const RECIPIENTS = [process.env.DISCORD_ZAC_ID, process.env.DISCORD_RYN_ID]

function startOfTodayMs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function formatOrders(orders) {
  if (orders.length === 0) return 'No salad orders came in today.'
  const lines = orders.map((o) => {
    const items = (o.items || [])
      .map((it) => `${it.name}${it.sauce ? ` (${it.sauce})` : ''}`)
      .join(', ')
    return `• ${o.customerName}: ${items} — Rp ${Number(o.total || 0).toLocaleString('id-ID')}`
  })
  const grandTotal = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  return `${lines.join('\n')}\n\nTotal: Rp ${grandTotal.toLocaleString('id-ID')} (${orders.length} order${orders.length === 1 ? '' : 's'})`
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    await adminDb.doc('settings/saladCorner').set({ isOpen: false }, { merge: true })

    const snapshot = await adminDb.collection('saladOrders').where('submittedAt', '>=', startOfTodayMs()).get()
    const orders = snapshot.docs.map((d) => d.data())

    const message = `**Salad Corner closed for today**\n${formatOrders(orders)}`
    await sendDiscordDMs(RECIPIENTS, message)

    res.status(200).json({ ok: true, orderCount: orders.length })
  } catch (err) {
    console.error('close-salad cron failed:', err)
    res.status(500).json({ ok: false })
  }
}
