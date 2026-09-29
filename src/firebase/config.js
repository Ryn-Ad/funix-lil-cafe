// This file is not wired into the app yet — the app currently runs on the
// localStorage mock in src/services/localStore.js so you can develop and
// demo everything without setting anything up. When you're ready to go
// live with real friends on real devices, follow FIREBASE_SETUP.md, fill
// in a .env file from .env.example, then uncomment the code below and
// swap useCollection/useDoc calls for the Firestore versions described
// in that file.

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
