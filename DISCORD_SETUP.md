# Discord notifications (free, no Vercel/Firebase upgrade needed)

This wires up two things:
- Every Coffee Corner order DMs Vel and Ryn on Discord, immediately.
- The Salad Corner closes itself automatically at 20:00 every day and
  DMs that day's order list to Zac and Ryn. It also opens itself at
  12:00. (The manual buttons in the admin dashboard still work too, for
  early closing or other one-offs.)

Everything here runs on Vercel's free Hobby plan and Firebase's free
Spark plan — no credit card, no Cloud Functions, no Blaze upgrade. The
trade-off, being upfront about it: Vercel Hobby's cron precision is
"within the hour," not to-the-minute — the 20:00 close might fire
anywhere between 20:00 and 20:59. For three friends and a lunch order,
that's a fine trade for free.

## 1. Create a Discord bot

1. Go to https://discord.com/developers/applications, click **New
   Application**, name it anything (e.g. "little cafe bot").
2. In the sidebar, go to **Bot**, click **Reset Token** (or it's shown
   once already), and copy the token. This is `DISCORD_BOT_TOKEN` —
   treat it like a password, never commit it or paste it in chat.
3. Still on the Bot page, you do **not** need to enable any Privileged
   Gateway Intents — this bot only ever sends messages over plain HTTPS
   calls, it never listens for anything.

## 2. Get the bot into a server with all three of you

Discord blocks bots from DMing someone they share no server with, to
stop spam — so the bot needs to be a member of at least one server that
Ryn, Zac and Vel are all also in. Easiest: make a small private server
just for this.

1. In Discord, create a new server (or use one you all already share).
2. Back in the Developer Portal, go to **OAuth2 > URL Generator**.
3. Under **Scopes**, check `bot`. No permissions need to be checked —
   this bot only sends DMs, it doesn't need to post in channels.
4. Copy the generated URL, open it, and add the bot to your server.

## 3. Get each person's Discord user ID

1. In Discord, go to **User Settings > Advanced** and enable **Developer
   Mode**.
2. Right-click each person's name (yours, Zac's, Vel's) and choose
   **Copy User ID**. These are `DISCORD_RYN_ID`, `DISCORD_ZAC_ID`,
   `DISCORD_VEL_ID`.

## 4. Get a Firebase service account (for the cron functions only)

1. Firebase console > Project settings (gear icon) > **Service
   accounts** tab.
2. Click **Generate new private key** — downloads a JSON file. Keep it
   secret; it has full admin access to your Firestore.
3. From that JSON, you need three values for your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` — copy the whole thing
     including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE
     KEY-----`, keeping it as one line with `\n` in place of real line
     breaks (this is what the JSON file already looks like — paste it
     exactly as-is, quotes included).

## 5. Generate a CRON_SECRET

Run `openssl rand -base64 32` in a terminal (or use any password
generator for a 32+ character random string). This is `CRON_SECRET` —
it proves a request to your cron endpoints really came from Vercel.

## 6. Fill in your local `.env`

Copy all the values above into `.env` (see `.env.example` for the
complete list, including the Firebase client-side ones from earlier).

## 7. Add the same variables to Vercel

Project > Settings > Environment Variables. Add every server-only
variable from `.env.example`'s bottom half: `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `DISCORD_BOT_TOKEN`,
`DISCORD_RYN_ID`, `DISCORD_ZAC_ID`, `DISCORD_VEL_ID`, `CRON_SECRET`.
Keep Production, Preview and Development ticked. Then redeploy.

**A common paste error:** if `FIREBASE_PRIVATE_KEY` doesn't paste
cleanly into Vercel's UI (it sometimes mangles the `\n` sequences),
wrap the whole value in quotes when pasting, or use `vercel env add
FIREBASE_PRIVATE_KEY` from the CLI instead, which handles it more
reliably.

## 8. Testing

**Coffee notifications:** place a test order through Coffee Corner on
your deployed site. Vel and Ryn should get a DM within a couple of
seconds. If nothing arrives, check the Vercel dashboard's Function Logs
for `notify-coffee-order` — the most common cause is the bot not
sharing a server with that person (step 2).

**Cron jobs**, two ways:
- Wait for 12:00 or 20:00 Jakarta time and see if it fires (check
  Project > Settings > Cron Jobs in the Vercel dashboard for run
  history and logs).
- Or trigger it manually any time, from a terminal:
  ```
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://your-app.vercel.app/api/cron/close-salad
  ```
  Swap in `open-salad` to test that one instead. This is exactly what
  Vercel's scheduler sends, so it's a faithful test — and it's also how
  you could force-close the corner from your phone without opening the
  admin dashboard, if you ever wanted to.

**Testing locally before deploying:** `npm run dev` does *not* run the
`/api` functions — that's a Vercel-specific feature. To test them on
your machine first, install the Vercel CLI (`npm install -g vercel`),
run `vercel link` once to connect this folder to your Vercel project,
then `vercel env pull .env` to sync your Vercel env vars locally, and
run `vercel dev` instead of `npm run dev`. It serves both the app and
the `/api` functions together on `localhost`.

## Why this needs no paid plan

- **Vercel Functions & Cron**: free on Hobby. Once-per-day minimum
  cadence is exactly what we need (open once, close once).
- **Firebase Admin SDK reads/writes**: count against the same free
  Firestore quota as everything else in the app — at this scale, not
  remotely close to the limit.
- **Discord's bot API**: free for a bot like this, no verification or
  payment tier required for low-volume DMs.

No Firebase Cloud Functions anywhere in this setup — that's the part
that would've required the paid Blaze plan. Vercel Functions do the
same job here for free instead.
