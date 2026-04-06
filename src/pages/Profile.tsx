import { useState } from 'react'
import { Settings, Star, Shield, Target, Zap, Award, LogOut, X, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { mockAchievements } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import type { PlayerPosition } from '../types'

const XP_PER_LEVEL = 500

const achievementsHe = [
  { id: 'ach-1', name: 'נגיעה ראשונה',  description: 'הצטרפת למשחק הראשון שלך', icon: '⚽', xp_reward: 50  },
  { id: 'ach-2', name: 'הטריקים',        description: 'כבשת 3 שערים במשחק אחד',  icon: '🎩', xp_reward: 150 },
  { id: 'ach-3', name: 'יוצר המשחק',    description: '10 בישולים סה"כ',          icon: '🎯', xp_reward: 200 },
  { id: 'ach-4', name: 'מנהיג הקבוצה',  description: 'יצרת 5 משחקים',           icon: '👑', xp_reward: 300 },
  { id: 'ach-5', name: 'איש הברזל',      description: 'שיחקת 50 משחקים',         icon: '🏃', xp_reward: 500 },
]

const POSITIONS: { value: PlayerPosition; labelHe: string; labelEn: string }[] = [
  { value: 'GK',  labelHe: 'שוער',    labelEn: 'Goalkeeper' },
  { value: 'DEF', labelHe: 'מגן',     labelEn: 'Defender'   },
  { value: 'MID', labelHe: 'קשר',     labelEn: 'Midfielder' },
  { value: 'FWD', labelHe: 'חלוץ',    labelEn: 'Forward'    },
  { value: 'ANY', labelHe: 'כל עמדה', labelEn: 'Any'        },
]

export default function Profile() {
  const { t, lang, toggleLang } = useLang()
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const p = user!

  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName]         = useState(p.name)
  const [editCity, setEditCity]         = useState(p.city ?? '')
  const [editPos,  setEditPos]          = useState<PlayerPosition>(p.position)
  const [saving,   setSaving]           = useState(false)

  const xpProgress = (p.stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL
  const xpToNext   = XP_PER_LEVEL - (p.stats.xp % XP_PER_LEVEL)
  const achs = lang === 'he' ? achievementsHe : mockAchievements

  const statRows = [
    { icon: Star,   label: t.stats.goals,   value: p.stats.goals,        color: '#FF5A1F' },
    { icon: Target, label: t.stats.assists,  value: p.stats.assists,      color: '#52b48d' },
    { icon: Shield, label: t.stats.games,    value: p.stats.games_played, color: '#8ecfb4' },
    { icon: Award,  label: t.stats.mvps,     value: p.stats.mvp_count,    color: '#FF7A47' },
  ]

  async function handleSave() {
    setSaving(true)
    await updateProfile({ name: editName, city: editCity || undefined, position: editPos })
    setSaving(false)
    setShowSettings(false)
  }

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
          <button
            onClick={() => { setEditName(p.name); setEditCity(p.city ?? ''); setEditPos(p.position); setShowSettings(true) }}
            className="w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform"
          >
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
              {p.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl tracking-wider leading-tight">{p.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge-green">{t.positions[p.position]}</span>
                {p.city && <span className="badge-gray">{p.city}</span>}
              </div>
            </div>
          </div>
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
          style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', color: '#ff6b6b' }}
        >
          <LogOut size={16} />
          {lang === 'he' ? 'התנתק' : 'Sign Out'}
        </button>
      </div>

      {/* Settings Bottom Sheet */}
      {showSettings && (
        <div className="fixed inset-0 z-50" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 space-y-4"
            style={{ background: '#121a15', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-lg">{lang === 'he' ? 'עריכת פרופיל' : 'Edit Profile'}</h3>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 glass-card flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
                {lang === 'he' ? 'שם' : 'Name'}
              </label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="input-glass w-full" />
            </div>

            <div>
              <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
                {lang === 'he' ? 'עיר' : 'City'}
              </label>
              <input value={editCity} onChange={e => setEditCity(e.target.value)}
                placeholder={lang === 'he' ? 'תל אביב' : 'Tel Aviv'} className="input-glass w-full" />
            </div>

            <div>
              <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
                {lang === 'he' ? 'עמדה' : 'Position'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {POSITIONS.map(pos => (
                  <button
                    key={pos.value}
                    onClick={() => setEditPos(pos.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all"
                    style={{
                      background: editPos === pos.value ? 'rgba(0,90,60,0.35)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${editPos === pos.value ? 'rgba(0,90,60,0.5)' : 'rgba(255,255,255,0.09)'}`,
                      color: editPos === pos.value ? '#52b48d' : 'rgba(240,244,242,0.5)',
                    }}
                  >
                    {lang === 'he' ? pos.labelHe : pos.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              {saving
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><Check size={16} /> {lang === 'he' ? 'שמור' : 'Save'}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
