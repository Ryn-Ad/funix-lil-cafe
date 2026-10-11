// Runs Friday at 16:00 Asia/Jakarta (see vercel.json): totals the week's
// coffee sales, works out profit and each partner's share, and DMs the
// report to Ryn. Reads the owner-only coffeeFinancials records, joined to
// coffeeOrders so an order an admin deleted drops out of the numbers.
import { adminDb } from '../_lib/firebaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'
import { sendDiscordDMs } from '../_lib/discord.js'
import { buildCoffeeWeeklyReport } from '../_lib/reports.js'
import { summarizeWeek, weekStartMs } from '../../shared/finance.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const docs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const weekStart = weekStartMs(Date.now())
    const weekEnd = weekStart + WEEK_MS
    const inWeek = (col) =>
      adminDb.collection(col).where('submittedAt', '>=', weekStart).where('submittedAt', '<', weekEnd).get()

    const [financialSnap, orderSnap, itemSnap, optionSnap, costSnap] = await Promise.all([
      inWeek('coffeeFinancials'),
      inWeek('coffeeOrders'),
      adminDb.collection('coffeeItems').get(),
      adminDb.collection('coffeeOptions').get(),
      adminDb.collection('coffeeCosts').get(),
    ])

    const orders = Object.fromEntries(docs(orderSnap).map((o) => [o.id, o]))
    const records = docs(financialSnap)
      .filter((f) => orders[f.id])
      .map((f) => ({ ...f, paid: !!orders[f.id].paid }))

    const costs = Object.fromEntries(docs(costSnap).map((c) => [c.id, c]))
    const report = buildCoffeeWeeklyReport({
      weekStart,
      summary: summarizeWeek(records),
      items: docs(itemSnap),
      options: docs(optionSnap),
      costs,
    })

    await sendDiscordDMs([process.env.DISCORD_RYN_ID], report)
    res.status(200).json({ ok: true, orders: records.length })
  } catch (err) {
    console.error('weekly-coffee-report failed:', err)
    res.status(500).json({ ok: false })
  }
}
