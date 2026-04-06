import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Zap, TrendingUp } from 'lucide-react'
import GameCard from '../components/GameCard'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import type { Game } from '../types'

const XP_PER_LEVEL = 500

function getGreeting(t: ReturnType<typeof useLang>['t']) {
  const h = new Date().getHours()
  if (h < 12) return t.home.good_morning
  if (h < 17) return t.home.good_afternoon
  return t.home.good_evening
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { user } = useAuth()
  const { games } = useGame()
  const [filter, setFilter] = useState<'all' | '5v5' | '7v7' | '11v11'>('all')
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const profile = user!

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  // Attach distances and filter
  const gamesWithDist: Game[] = games.map(g => ({
    ...g,
    distance_km: userPos
      ? Math.round(haversineKm(userPos.lat, userPos.lng, g.location_lat, g.location_lng) * 10) / 10
      : undefined,
  }))

  const filtered = filter === 'all' ? gamesWithDist : gamesWithDist.filter(g => g.format === filter)
  const nearbyGames = filtered
    .filter(g => g.status !== 'finished')
    .sort((a, b) => userPos && a.distance_km != null && b.distance_km != null
      ? a.distance_km - b.distance_km
      : 0)
    .slice(0, 4)

  const xpProgress = (profile.stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL
  const xpToNext   = XP_PER_LEVEL - (profile.stats.xp % XP_PER_LEVEL)

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="gradient-radial-ember absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-40" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-heading font-semibold uppercase tracking-widest text-secondary mb-0.5">
              {getGreeting(t)}
            </p>
            <h1 className="font-display text-3xl tracking-wider text-primary">
              {profile.name.split(' ')[0]}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card px-3 py-2 flex items-center gap-2">
              <Zap size={13} className="text-ember-400" />
              <span className="font-heading font-bold text-sm text-primary">{t.home.level} {profile.stats.level}</span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm active:scale-90 transition-transform"
              style={{ background: 'linear-gradient(135deg, #005A3C, #007a50)', boxShadow: '0 0 0 2px rgba(0,90,60,0.5)' }}
            >
              {profile.name.split(' ').map((n: string) => n[0]).join('')}
            </button>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-heading font-semibold uppercase tracking-wider text-muted mb-1.5">
            <span>{profile.stats.xp.toLocaleString()} XP</span>
            <span>{xpToNext} {t.home.xp_to_level} {profile.stats.level + 1}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpProgress * 100}%`, background: 'linear-gradient(90deg, #005A3C, #52b48d)', boxShadow: '0 0 8px rgba(82,180,141,0.5)' }}
            />
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="relative z-10 px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: t.stats.games,   value: profile.stats.games_played },
            { label: t.stats.goals,   value: profile.stats.goals        },
            { label: t.stats.assists, value: profile.stats.assists      },
            { label: t.stats.mvps,    value: profile.stats.mvp_count, accent: true },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="glass-card flex flex-col items-center py-3 gap-0.5 opacity-0 animate-fade-up fill-forwards stagger-1"
            >
              <span className="font-display text-xl leading-none" style={{ color: accent ? '#FF5A1F' : '#52b48d' }}>
                {value}
              </span>
              <span className="text-[9px] font-heading font-semibold uppercase tracking-widest text-muted text-center leading-tight px-1">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby Games */}
      <section className="relative z-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-pitch-400" />
            <h2 className="font-heading font-bold text-base uppercase tracking-wider">{t.home.nearby_games}</h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-heading font-semibold uppercase tracking-wider"
            style={{ color: '#52b48d' }}
          >
            {t.home.see_all}
          </button>
        </div>

        {/* Format filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {(['all', '5v5', '7v7', '11v11'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-200"
              style={{
                background: filter === f ? 'rgba(0,90,60,0.35)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filter === f ? 'rgba(0,90,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === f ? '#52b48d' : 'rgba(240,244,242,0.45)',
              }}
            >
              {f === 'all' ? t.home.all : f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {nearbyGames.length === 0 ? (
            <div className="glass-card py-10 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">⚽</span>
              <p className="font-heading font-bold text-sm">{t.explore.no_games}</p>
            </div>
          ) : nearbyGames.map((game, i) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => navigate(`/game/${game.id}`)}
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      </section>

      {/* Create Game FAB */}
      <button
        onClick={() => navigate('/create-game')}
        className="fixed z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl font-heading font-bold text-sm uppercase tracking-wider"
        style={{
          bottom: 'calc(80px + var(--safe-bottom) + 16px)',
          insetInlineEnd: '20px',
          background: 'linear-gradient(135deg, #00c36b, #007a50)',
          boxShadow: '0 8px 32px rgba(0,195,107,0.45)',
          color: '#fff',
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        {t.home.new_game}
      </button>
    </div>
  )
}
