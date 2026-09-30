// Triggered daily by Vercel Cron (see vercel.json) at 12:00 Asia/Jakarta
// time. Opens the Salad Corner and sets today's 20:00 close time.
import { adminDb } from '../_lib/firebaseAdmin.js'
import { isAuthorizedCron } from '../_lib/cronAuth.js'

function todayAt(hour, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

export default async function handler(req, res) {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    await adminDb.doc('settings/saladCorner').set({ isOpen: true, closesAt: todayAt(20, 0) }, { merge: true })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('open-salad cron failed:', err)
    res.status(500).json({ ok: false })
  }
}
