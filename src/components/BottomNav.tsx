import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, MessageCircle, User } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useLang()

  const tabs = [
    { path: '/',        icon: Home,          label: t.tabs.home    },
    { path: '/explore', icon: Compass,       label: t.tabs.explore },
    { path: '/chats',   icon: MessageCircle, label: t.tabs.chats   },
    { path: '/profile', icon: User,          label: t.tabs.profile },
  ]

  return (
    <nav className="tab-bar">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 active:scale-90"
              style={{ minWidth: 60 }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className="transition-all duration-200"
                  style={{ color: active ? '#52b48d' : 'rgba(240,244,242,0.4)' }}
                />
                {active && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: '#52b48d' }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-heading font-semibold uppercase tracking-wider transition-all duration-200"
                style={{ color: active ? '#52b48d' : 'rgba(240,244,242,0.35)' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
