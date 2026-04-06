import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin } from 'lucide-react'
import GameCard from '../components/GameCard'
import type { GameFormat } from '../types'
import { useLang } from '../contexts/LanguageContext'
import { useGame } from '../contexts/GameContext'

export default function Explore() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { games } = useGame()
  const [query, setQuery]   = useState('')
  const [format, setFormat] = useState<GameFormat | 'all'>('all')
  const [city, setCity]     = useState<string>('all')

  const cities = ['all', ...Array.from(new Set(games.map(g => g.city)))]

  const results = games.filter(g => {
    const matchQ = !query || g.title.toLowerCase().includes(query.toLowerCase()) ||
                   g.location_name.toLowerCase().includes(query.toLowerCase())
    const matchF = format === 'all' || g.format === format
    const matchC = city   === 'all' || g.city   === city
    return matchQ && matchF && matchC
  })

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-30" />
      </div>

      <header className="relative z-10 px-5 pt-14 pb-5">
        <h1 className="font-display text-4xl tracking-wider mb-1">{t.explore.title}</h1>
        <p className="text-secondary text-sm font-body">{t.explore.subtitle}</p>
      </header>

      {/* Search */}
      <div className="relative z-10 px-5 mb-4">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-muted" style={{ insetInlineStart: '16px' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.explore.search}
            className="input-glass"
            style={{ paddingInlineStart: '40px' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-10 px-5 mb-5 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['all', '5v5', '7v7', '11v11'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-200"
              style={{
                background: format === f ? 'rgba(0,90,60,0.35)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${format === f ? 'rgba(0,90,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: format === f ? '#52b48d' : 'rgba(240,244,242,0.45)',
              }}
            >
              {f === 'all' ? t.explore.all_formats : f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {cities.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold tracking-wide transition-all duration-200"
              style={{
                background: city === c ? 'rgba(255,90,31,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${city === c ? 'rgba(255,90,31,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: city === c ? '#FF7A47' : 'rgba(240,244,242,0.45)',
              }}
            >
              {c !== 'all' && <MapPin size={10} />}
              {c === 'all' ? t.explore.all_cities : c}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="relative z-10 px-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-secondary">
            {results.length} {results.length === 1 ? t.explore.game_found : t.explore.games_found}
          </span>
          <button className="flex items-center gap-1.5 text-xs font-heading font-semibold text-secondary">
            <SlidersHorizontal size={12} />
            {t.explore.sort}
          </button>
        </div>

        {results.length === 0 ? (
          <div className="glass-card py-12 flex flex-col items-center gap-3 text-center mt-4">
            <span className="text-4xl">⚽</span>
            <p className="font-heading font-bold text-base">{t.explore.no_games}</p>
            <p className="text-secondary text-sm">{t.explore.adjust}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => navigate(`/game/${game.id}`)}
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
