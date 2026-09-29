// A tiny localStorage-backed store that mimics the shape of a Firestore
// collection: read every doc, add one, update one by id. Components use
// useCollection()/useDoc() the same way they'd use a Firestore hook, so
// swapping the internals below for real onSnapshot/addDoc/updateDoc calls
// later won't require touching any component code. See FIREBASE_SETUP.md.

import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export function useCollection(key) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, key),
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (error) => {
        // Shows up here almost always because of a Firestore security
        // rule rejecting the read — check the browser console for the
        // exact rule path it failed on.
        console.error(`useCollection("${key}") failed:`, error)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [key])

  const add = useCallback((data) => addDoc(collection(db, key), data), [key])
  
  const update = useCallback((id, patch) => updateDoc(doc(db, key, id), patch), [key])
  
  const remove = useCallback((id) => deleteDoc(doc(db, key, id)), [key])
  
  return { items, add, update, remove, loading }
}

// One doc = one useDoc(key) call, stored at settings/{key} — e.g.
// useDoc('saladCorner') reads/writes the doc at settings/saladCorner,
// which is exactly the path firestore.rules already grants salad_admin
// and owner write access to.
export function useDoc(key, fallback) {
  const [value, setValue] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', key),
      (snap) => {
        setValue(snap.exists() ? snap.data() : fallback)
        setLoading(false)
      },
      (error) => {
        console.error(`useDoc("${key}") failed:`, error)
        setLoading(false)
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const save = useCallback(
    (patch) => setDoc(doc(db, 'settings', key), patch, { merge: true }),
    [key]
  )

  return { value, save, loading }
}

// Run once at startup (see main.jsx). Writes each seed item under its
// own fixed id (so re-running never duplicates them) — but only if the
// collection is currently completely empty, so it never overwrites
// anything you've since added, edited, or deleted through the app.
export async function seedIfEmpty(key, seedData) {
  const snapshot = await getDocs(collection(db, key))
  if (!snapshot.empty) return
  await Promise.all(seedData.map(({ id, ...rest }) => setDoc(doc(db, key, id), rest)))
}
