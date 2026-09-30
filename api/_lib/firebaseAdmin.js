// Firebase Admin SDK setup — used only by the cron functions, which run
// with no signed-in user and need to read/write Firestore directly,
// bypassing firestore.rules entirely (that's what a service account is
// for: a trusted server identity, never exposed to the browser).
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp() {
  const existing = getApps()
  if (existing.length) return existing[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel env var values can't contain literal newlines, so the key
      // is stored with them escaped as \n and unescaped again here.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore(getAdminApp())
