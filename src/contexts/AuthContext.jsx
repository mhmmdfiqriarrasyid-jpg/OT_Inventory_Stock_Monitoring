import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]     = useState(null)
  const [userProfile, setUserProfile]     = useState(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const ref  = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setUserProfile(snap.data())
        } else {
          // First sign-in: create profile with viewer role
          const profile = {
            uid:       user.uid,
            name:      user.displayName ?? user.email.split('@')[0],
            email:     user.email,
            role:      'viewer',
            active:    true,
            createdAt: serverTimestamp(),
          }
          await setDoc(ref, profile)
          setUserProfile(profile)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const signOut = () => firebaseSignOut(auth)

  const isAdmin   = userProfile?.role === 'admin'
  const isManager = userProfile?.role === 'manager' || isAdmin
  const isViewer  = !!userProfile

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signIn, signOut, isAdmin, isManager, isViewer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
