import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav    from './components/BottomNav'
import Home         from './pages/Home'
import Explore      from './pages/Explore'
import Chats        from './pages/Chats'
import Profile      from './pages/Profile'
import GameDetail   from './pages/GameDetail'
import CreateGame   from './pages/CreateGame'
import Onboarding   from './pages/Onboarding'
import Login        from './pages/Login'
import ChatRoom     from './pages/ChatRoom'
import { useAuth }  from './contexts/AuthContext'

const HIDE_NAV  = ['/create-game', '/onboarding', '/login']
const CHAT_ROOM = /^\/game\/.+\/chat$/

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-pitch-600 border-t-pitch-400 animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  const onboarded = localStorage.getItem('kadur-onboarded')
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { pathname } = useLocation()
  const showNav = !HIDE_NAV.some(p => pathname.startsWith(p)) &&
                  !pathname.startsWith('/game/') &&
                  !CHAT_ROOM.test(pathname)

  return (
    <div className="relative min-h-screen max-w-md mx-auto">
      <Routes>
        {/* Public */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login"      element={<RequireOnboarded><Login /></RequireOnboarded>} />

        {/* Protected */}
        <Route path="/" element={
          <RequireOnboarded><RequireAuth><Home /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/explore" element={
          <RequireOnboarded><RequireAuth><Explore /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/chats" element={
          <RequireOnboarded><RequireAuth><Chats /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/profile" element={
          <RequireOnboarded><RequireAuth><Profile /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/game/:id" element={
          <RequireOnboarded><RequireAuth><GameDetail /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/game/:id/chat" element={
          <RequireOnboarded><RequireAuth><ChatRoom /></RequireAuth></RequireOnboarded>
        }/>
        <Route path="/create-game" element={
          <RequireOnboarded><RequireAuth><CreateGame /></RequireAuth></RequireOnboarded>
        }/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showNav && <BottomNav />}
    </div>
  )
}
