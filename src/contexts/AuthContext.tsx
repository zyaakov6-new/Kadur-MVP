import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FbUser,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { auth, db, FIREBASE_READY } from '../lib/firebase'
import { mockProfile } from '../data/mockData'
import type { Profile } from '../types'

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface LoginOpts {
  email:     string
  name:      string
  city?:     string
  position?: string
  password:  string
  isNewUser: boolean
}

interface AuthContextValue {
  user:          Profile | null
  loading:       boolean
  login:         (opts: LoginOpts) => Promise<{ error?: string; needsConfirmation?: boolean }>
  logout:        () => Promise<void>
  updateProfile: (partial: Partial<Pick<Profile, 'name' | 'city' | 'position'>>) => Promise<void>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const USER_KEY = 'kadur-user'

function fbUserToProfile(fb: FbUser, data: Record<string, unknown>): Profile {
  return {
    id:         fb.uid,
    email:      fb.email ?? undefined,
    name:       (data.name as string) || fb.email?.split('@')[0] || 'Player',
    city:       (data.city as string) || undefined,
    position:   (data.position as Profile['position']) || 'MID',
    avatar_url: (data.avatar_url as string) || undefined,
    stats:      (data.stats as Profile['stats']) || mockProfile.stats,
    created_at: (data.created_at as string) || new Date().toISOString(),
  }
}

async function loadProfile(fb: FbUser): Promise<Profile | null> {
  const snap = await getDoc(doc(db, 'users', fb.uid))
  if (!snap.exists()) return null
  return fbUserToProfile(fb, snap.data())
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!FIREBASE_READY) {
      // Dev fallback: restore from localStorage
      const stored = localStorage.getItem(USER_KEY)
      if (stored) {
        try { setUser(JSON.parse(stored)) } catch {}
      }
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (fb) => {
      if (fb) {
        const profile = await loadProfile(fb)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsub
  }, [])

  // ── login ────────────────────────────────────────────────────────────────
  async function login(opts: LoginOpts): Promise<{ error?: string }> {
    // Dev fallback
    if (!FIREBASE_READY) {
      const profile: Profile = {
        ...mockProfile,
        name:     opts.name || opts.email.split('@')[0],
        email:    opts.email,
        city:     opts.city  ?? mockProfile.city,
        position: (opts.position as Profile['position']) ?? 'MID',
      }
      setUser(profile)
      localStorage.setItem(USER_KEY, JSON.stringify(profile))
      return {}
    }

    try {
      if (opts.isNewUser) {
        const cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          name:       opts.name,
          email:      opts.email,
          city:       opts.city     ?? null,
          position:   opts.position ?? 'MID',
          avatar_url: null,
          stats:      mockProfile.stats,
          created_at: serverTimestamp(),
        })
        return {}
      } else {
        await signInWithEmailAndPassword(auth, opts.email, opts.password)
        return {}
      }
    } catch (e: unknown) {
      const msg = (e as { code?: string; message?: string }).code ?? ''
      if (msg.includes('email-already-in-use'))
        return { error: 'כתובת האימייל כבר בשימוש' }
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        return { error: 'אימייל או סיסמה שגויים' }
      if (msg.includes('weak-password'))
        return { error: 'הסיסמה חלשה מדי (לפחות 6 תווים)' }
      return { error: (e as { message?: string }).message ?? 'שגיאה לא ידועה' }
    }
  }

  // ── logout ───────────────────────────────────────────────────────────────
  async function logout() {
    if (!FIREBASE_READY) {
      setUser(null)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('kadur-onboarded')
      return
    }
    await fbSignOut(auth)
    setUser(null)
  }

  // ── updateProfile ────────────────────────────────────────────────────────
  async function updateProfile(partial: Partial<Pick<Profile, 'name' | 'city' | 'position'>>) {
    if (!user) return
    const updated: Profile = { ...user, ...partial }
    setUser(updated)
    if (!FIREBASE_READY) {
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return
    }
    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...(partial.name     && { name:     partial.name }),
        ...(partial.city     && { city:     partial.city }),
        ...(partial.position && { position: partial.position }),
      })
    } catch {
      setUser(user)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
