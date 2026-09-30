// Talks to Discord's REST API directly over fetch — no discord.js needed
// for simple one-off DMs, which keeps this dependency-free and fast to
// cold-start as a serverless function.
//
// IMPORTANT: this file only ever runs server-side (inside /api). Never
// import it from anything in src/ — DISCORD_BOT_TOKEN would end up in
// the browser bundle, which is a real secret leak, not a theoretical one.

const DISCORD_API = 'https://discord.com/api/v10'

async function discordFetch(path, options = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Discord API ${path} failed: ${res.status} ${body}`)
  }
  return res.status === 204 ? null : res.json()
}

// Opens (or reuses) a DM channel with a user, then sends the message.
// Requires the bot to share at least one server with that user —
// Discord blocks bots from DMing people they have no server in common
// with, to prevent spam. See DISCORD_SETUP.md.
async function sendDiscordDM(userId, content) {
  const channel = await discordFetch('/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: userId }),
  })
  await discordFetch(`/channels/${channel.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

// Sends the same message to several people. One person's failure (DMs
// closed, left the server) never stops the others from getting theirs.
export async function sendDiscordDMs(userIds, content) {
  const ids = userIds.filter(Boolean)
  const results = await Promise.allSettled(ids.map((id) => sendDiscordDM(id, content)))
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Discord DM to ${ids[i]} failed:`, r.reason)
    }
  })
}
