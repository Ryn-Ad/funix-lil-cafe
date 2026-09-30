// Vercel signs its own cron invocations with an Authorization header
// matching your CRON_SECRET env var — this confirms the request really
// came from Vercel's scheduler and not a random visitor who guessed the
// URL. See DISCORD_SETUP.md for how to generate and set CRON_SECRET.
export function isAuthorizedCron(req) {
  if (!process.env.CRON_SECRET) return false
  return req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`
}
