import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home       from './pages/Home'
import Explore    from './pages/Explore'
import Chats      from './pages/Chats'
import Profile    from './pages/Profile'
import GameDetail from './pages/GameDetail'
import CreateGame from './pages/CreateGame'

const HIDE_NAV = ['/create-game']

export default function App() {
  const { pathname } = useLocation()
  const showNav = !HIDE_NAV.some(p => pathname.startsWith(p)) &&
                  !pathname.startsWith('/game/')

  return (
    <div className="relative min-h-screen max-w-md mx-auto">
      <Routes>
        <Route path="/"              element={<Home />}       />
        <Route path="/explore"       element={<Explore />}    />
        <Route path="/chats"         element={<Chats />}      />
        <Route path="/profile"       element={<Profile />}    />
        <Route path="/game/:id"      element={<GameDetail />} />
        <Route path="/create-game"   element={<CreateGame />} />
      </Routes>

      {showNav && <BottomNav />}
    </div>
  )
}
