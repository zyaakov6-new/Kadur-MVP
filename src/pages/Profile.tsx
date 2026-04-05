import { Settings, Star, Shield, Target, Zap, Award, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockAchievements } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

const XP_PER_LEVEL = 500

const achievementsHe = [
  { id: 'ach-1', name: 'נגיעה ראשונה',  description: 'הצטרפת למשחק הראשון שלך', icon: '⚽', xp_reward: 50  },
  { id: 'ach-2', name: 'הטריקים',        description: 'כבשת 3 שערים במשחק אחד',  icon: '🎩', xp_reward: 150 },
  { id: 'ach-3', name: 'יוצר המשחק',    description: '10 בישולים סה"כ',          icon: '🎯', xp_reward: 200 },
  { id: 'ach-4', name: 'מנהיג הקבוצה',  description: 'יצרת 5 משחקים',           icon: '👑', xp_reward: 300 },
  { id: 'ach-5', name: 'איש הברזל',      description: 'שיחקת 50 משחקים',         icon: '🏃', xp_reward: 500 },
]

export default function Profile() {
  const { t, lang, toggleLang } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const p = user!

  const xpProgress = (p.stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL
  const xpToNext   = XP_PER_LEVEL - (p.stats.xp % XP_PER_LEVEL)

  const achs = lang === 'he' ? achievementsHe : mockAchievements

  const statRows = [
    { icon: Star,   label: t.stats.goals,   value: p.stats.goals,        color: '#FF5A1F' },
    { icon: Target, label: t.stats.assists,  value: p.stats.assists,      color: '#52b48d' },
    { icon: Shield, label: t.stats.games,    value: p.stats.games_played, color: '#8ecfb4' },
    { icon: Award,  label: t.stats.mvps,     value: p.stats.mvp_count,    color: '#FF7A47' },
  ]

  function handleLogout() {
    logout()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="gradient-radial-ember absolute inset-0" />
        <div className="hex-pattern absolute inset-0 opacity-25" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-4">
        <h1 className="font-display text-4xl tracking-wider">{t.profile.title}</h1>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <span className="text-base leading-none">{lang === 'he' ? '🇮🇱' : '🇬🇧'}</span>
            <span className="text-xs font-heading font-bold uppercase tracking-wider" style={{ color: '#52b48d' }}>
              {lang === 'he' ? 'EN' : 'עב'}
            </span>
          </button>
          <button className="w-10 h-10 glass-card flex items-center justify-center">
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="relative z-10 px-5 mb-5">
        <div className="glass-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #005A3C, #007a50)', boxShadow: '0 0 24px rgba(0,90,60,0.4)' }}
            >
              {p.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl tracking-wider leading-tight">{p.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge-green">{t.positions[p.position]}</span>
                {p.city && <span className="badge-gray">{p.city}</span>}
              </div>
            </div>
          </div>

          {/* Level + XP */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-ember-400" />
                <span className="font-heading font-bold text-sm">{t.home.level} {p.stats.level}</span>
              </div>
              <span className="text-xs font-heading text-secondary">
                {p.stats.xp.toLocaleString()} XP · {xpToNext} {t.profile.xp_to_next}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${xpProgress * 100}%`, background: 'linear-gradient(90deg, #005A3C, #52b48d)', boxShadow: '0 0 8px rgba(82,180,141,0.5)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-muted mb-3">{t.profile.stats}</h3>
        <div className="grid grid-cols-2 gap-3">
          {statRows.map(({ icon: Icon, label, value, color }, i) => (
            <div
              key={label}
              className="glass-card p-4 flex items-center gap-3 opacity-0 animate-fade-up fill-forwards"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="font-display text-xl leading-none" style={{ color }}>{value}</p>
                <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="relative z-10 px-5 mb-5">
        <h3 className="font-heading font-bold text-xs uppercase tracking-widest text-muted mb-3">{t.profile.achievements}</h3>
        <div className="space-y-2">
          {achs.map((ach, i) => (
            <div
              key={ach.id}
              className="glass-card p-3.5 flex items-center gap-3 opacity-0 animate-fade-up fill-forwards"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="text-2xl">{ach.icon}</span>
              <div className="flex-1">
                <p className="font-heading font-bold text-sm">{ach.name}</p>
                <p className="text-xs text-secondary">{ach.description}</p>
              </div>
              <span className="badge-green flex-shrink-0">+{ach.xp_reward} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="relative z-10 px-5 mb-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-heading font-bold text-sm uppercase tracking-wider transition-all duration-200 active:scale-95"
          style={{
            background: 'rgba(255,59,48,0.08)',
            border: '1px solid rgba(255,59,48,0.25)',
            color: '#ff6b6b',
          }}
        >
          <LogOut size={16} />
          {lang === 'he' ? 'התנתק' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
