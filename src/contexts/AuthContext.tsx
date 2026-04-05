import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Profile } from '../types'
import { mockProfile } from '../data/mockData'

interface LoginOpts {
  email:     string
  name:      string
  city?:     string
  position?: string
  isNewUser: boolean
}

interface AuthContextValue {
  user:    Profile | null
  loading: boolean
  login:   (opts: LoginOpts) => void
  logout:  () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const USER_KEY = 'kadur-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  function login({ email, name, city, position, isNewUser: _ }: LoginOpts) {
    const profile: Profile = {
      ...mockProfile,
      name:     name || email.split('@')[0],
      city:     city  || mockProfile.city,
      position: (position as Profile['position']) || 'MID',
    }
    setUser(profile)
    localStorage.setItem(USER_KEY, JSON.stringify(profile))
    // Mark as not-new so re-logins skip onboarding
    localStorage.setItem('kadur-onboarded', '1')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(USER_KEY)
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
