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
import type { Profile } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────

export const ZERO_STATS: Profile['stats'] = {
  goals: 0, assists: 0, games_played: 0, mvp_count: 0, xp: 0, level: 1,
}

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
  login:         (opts: LoginOpts) => Promise<{ error?: string }>
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
    stats:      (data.stats as Profile['stats']) || ZERO_STATS,
    created_at: (data.created_at as string) || new Date().toISOString(),
  }
}

async function loadOrCreateProfile(fb: FbUser, defaults?: Partial<Record<string, unknown>>): Promise<Profile> {
  const ref  = doc(db, 'users', fb.uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data  = snap.data()
    const stats = data.stats as Profile['stats'] | undefined

    // One-time migration: if profile has the old mock stats, reset to zero
    const isMockStats = stats && (stats.xp === 2840 || stats.level === 8 || stats.games_played === 57)
    if (isMockStats) {
      await updateDoc(ref, { stats: ZERO_STATS, statsVersion: 1 })
      return fbUserToProfile(fb, { ...data, stats: ZERO_STATS })
    }

    return fbUserToProfile(fb, data)
  }

  // Profile missing — auto-create so login never bounces
  const newData = {
    name:       defaults?.name ?? fb.displayName ?? fb.email?.split('@')[0] ?? 'Player',
    email:      fb.email ?? null,
    city:       defaults?.city ?? null,
    position:   defaults?.position ?? 'MID',
    avatar_url: null,
    stats:      ZERO_STATS,
    created_at: serverTimestamp(),
  }
  await setDoc(ref, newData)
  return fbUserToProfile(fb, { ...newData, created_at: new Date().toISOString() })
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
        try {
          const profile = await loadOrCreateProfile(fb)
          setUser(profile)
        } catch {
          setUser(null)
        }
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
        id:         'dev-user',
        email:      opts.email,
        name:       opts.name || opts.email.split('@')[0],
        city:       opts.city,
        position:   (opts.position as Profile['position']) ?? 'MID',
        stats:      ZERO_STATS,
        created_at: new Date().toISOString(),
      }
      setUser(profile)
      localStorage.setItem(USER_KEY, JSON.stringify(profile))
      return {}
    }

    try {
      if (opts.isNewUser) {
        const cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password)
        // Create profile in Firestore with zero stats
        await setDoc(doc(db, 'users', cred.user.uid), {
          name:       opts.name,
          email:      opts.email,
          city:       opts.city  ?? null,
          position:   opts.position ?? 'MID',
          avatar_url: null,
          stats:      ZERO_STATS,
          created_at: serverTimestamp(),
        })
        // onAuthStateChanged will fire and call loadOrCreateProfile
        return {}
      } else {
        await signInWithEmailAndPassword(auth, opts.email, opts.password)
        return {}
      }
    } catch (e: unknown) {
      const msg = (e as { code?: string }).code ?? ''
      if (msg.includes('email-already-in-use'))
        return { error: 'כתובת האימייל כבר בשימוש' }
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        return { error: 'אימייל או סיסמה שגויים' }
      if (msg.includes('weak-password'))
        return { error: 'הסיסמה חלשה מדי (לפחות 6 תווים)' }
      if (msg.includes('invalid-email'))
        return { error: 'כתובת אימייל לא תקינה' }
      if (msg.includes('too-many-requests'))
        return { error: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר' }
      return { error: (e as { message?: string }).message ?? 'שגיאה לא ידועה' }
    }
  }

  // ── logout ───────────────────────────────────────────────────────────────
  async function logout() {
    if (!FIREBASE_READY) {
      setUser(null)
      localStorage.removeItem(USER_KEY)
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
        ...(partial.name     !== undefined && { name:     partial.name }),
        ...(partial.city     !== undefined && { city:     partial.city }),
        ...(partial.position !== undefined && { position: partial.position }),
      })
    } catch {
      setUser(user) // revert on failure
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
