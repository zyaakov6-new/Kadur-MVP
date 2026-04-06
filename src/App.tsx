import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import BottomNav    from './components/BottomNav'
import Home         from './pages/Home'
import Explore      from './pages/Explore'
import Chats        from './pages/Chats'
import Profile      from './pages/Profile'
import GameDetail   from './pages/GameDetail'
import CreateGame   from './pages/CreateGame'
import Onboarding   from './pages/Onboarding'
import Auth         from './pages/Auth'
import ChatRoom     from './pages/ChatRoom'
import { useAuth }  from './contexts/AuthContext'

const HIDE_NAV = ['/create-game', '/onboarding', '/auth']

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e0c' }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(82,180,141,0.2)', borderTopColor: '#52b48d' }}
        />
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />
  return <>{children}</>
}

export default function App() {
  const { pathname } = useLocation()
  const showNav = !HIDE_NAV.some(p => pathname.startsWith(p)) &&
                  !pathname.startsWith('/game/')

  return (
    <div className="relative min-h-screen max-w-md mx-auto">
      <Routes>
        {/* Public */}
        <Route path="/auth"        element={<Auth />} />
        <Route path="/onboarding"  element={<RequireAuth><Onboarding /></RequireAuth>} />

        {/* Protected */}
        <Route path="/"            element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/explore"     element={<RequireAuth><Explore /></RequireAuth>} />
        <Route path="/chats"       element={<RequireAuth><Chats /></RequireAuth>} />
        <Route path="/profile"     element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/game/:id"    element={<RequireAuth><GameDetail /></RequireAuth>} />
        <Route path="/game/:id/chat" element={<RequireAuth><ChatRoom /></RequireAuth>} />
        <Route path="/create-game" element={<RequireAuth><CreateGame /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNav && <BottomNav />}
      <Analytics />
    </div>
  )
}
