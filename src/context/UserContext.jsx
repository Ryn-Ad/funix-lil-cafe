import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

// Two separate identities live here:
//  - customers: just a name, kept in localStorage, no account at all
//  - admins (Ryn/Zac/Vel): a real Firebase Auth session, resolved to a
//    role by reading users/{uid} in Firestore — the same collection
//    firestore.rules already trusts for role() checks
const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('cafe_name') || '')

  const [firebaseUser, setFirebaseUser] = useState(null)
  const [adminProfile, setAdminProfile] = useState(null) // { role, name } once loaded
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Restores the admin session automatically on page reload — Firebase
  // persists it in the browser, so Zac doesn't need to sign in every time.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  // Once we know who's signed in, look up their role. Live-subscribed so
  // a role change in Firestore takes effect without a re-login.
  useEffect(() => {
    if (!firebaseUser) {
      setAdminProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    const unsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      setAdminProfile(snap.exists() ? snap.data() : null)
      setProfileLoading(false)
    })
    return unsubscribe
  }, [firebaseUser])

  const loginAsCustomer = (rawName) => {
    const trimmed = rawName.trim()
    if (!trimmed) return
    localStorage.setItem('cafe_name', trimmed)
    setCustomerName(trimmed)
  }

  // Throws on failure (wrong password, unknown email) — NameGate catches
    // it and shows a message.
    const loginAsAdmin = (email, password) => signInWithEmailAndPassword(auth, email, password)
  
    const logout = async () => {
      if (firebaseUser) await signOut(auth)
      localStorage.removeItem('cafe_name')
      setCustomerName('')
    }
  
    const isAdmin = !!firebaseUser && !!adminProfile
    const name = isAdmin ? adminProfile.name || firebaseUser.email : customerName
    const role = isAdmin ? adminProfile.role : customerName ? 'customer' : null
    const loading = authLoading || profileLoading
  
    return (
      <UserContext.Provider value={{ name, role, isAdmin, loading, loginAsCustomer, loginAsAdmin, logout }}>
        {children}
      </UserContext.Provider>
    )
  }
  
  export function useUser() {
    return useContext(UserContext)
}
