import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Profile } from '../types'
import { mockProfile } from '../data/mockData'

interface AuthContextValue {
  user:    Profile | null
  loading: boolean
  login:   (opts: { phone: string }) => void
  logout:  () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'kadur-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  function login({ phone }: { phone: string }) {
    // In production this would call Supabase; here we use the mock profile
    const profile: Profile = { ...mockProfile, phone }
    setUser(profile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('kadur-onboarded')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
