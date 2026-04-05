import { MapPin, Clock, Users, ChevronRight, ChevronLeft } from 'lucide-react'
import type { Game } from '../types'
import { getOccupancyPercent } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'

interface GameCardProps {
  game: Game
  onClick?: () => void
  style?: React.CSSProperties
}

const formatBadgeColors: Record<string, string> = {
  '5v5':  'badge-green',
  '7v7':  'badge-ember',
  '11v11':'badge-gray',
}

export default function GameCard({ game, onClick, style }: GameCardProps) {
  const { t, isRTL } = useLang()
  const pct    = getOccupancyPercent(game)
  const isFull = game.status === 'full'
  const spots  = game.max_players - game.current_players

  function formatTime(iso: string) {
    const date = new Date(iso)
    const now  = new Date()
    const diffMs    = date.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 1) return t.time.in_minutes.replace('{{n}}', String(Math.round(diffMs / 60000)))
    if (diffHours < 24) return t.time.in_hours.replace('{{n}}', String(Math.round(diffHours)))
    if (Math.floor(diffHours / 24) === 1) return t.time.tomorrow
    return t.time.in_days.replace('{{n}}', String(Math.floor(diffHours / 24)))
  }

  const ChevronEnd = isRTL ? ChevronLeft : ChevronRight

  return (
    <button
      onClick={onClick}
      style={style}
      className="glass-card-hover w-full text-left group opacity-0 animate-fade-up fill-forwards"
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base leading-tight text-primary truncate mb-1">
              {game.title}
            </h3>
            {game.description && (
              <p className="text-secondary text-xs font-body line-clamp-1">{game.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={formatBadgeColors[game.format] || 'badge-gray'}>{game.format}</span>
            {isFull && <span className="badge-ember">{t.game.full}</span>}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-secondary font-body">
          <span className="flex items-center gap-1.5">
            <MapPin size={11} className="text-pitch-400 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{game.location_name}</span>
            {game.distance_km && <span className="text-muted">· {game.distance_km}km</span>}
          </span>
          <span className="flex items-center gap-1.5 mr-auto flex-shrink-0">
            <Clock size={11} className="text-ember-400 flex-shrink-0" />
            {formatTime(game.scheduled_at)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-xs text-secondary">
            <Users size={11} />
            <span>{game.current_players} / {game.max_players}</span>
          </span>
          <span className={`text-xs font-heading font-semibold ${isFull ? 'text-ember-400' : 'text-pitch-400'}`}>
            {isFull
              ? t.game.no_spots
              : `${spots} ${spots === 1 ? t.game.spot_left : t.game.spots_left}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isFull
                ? 'linear-gradient(90deg, #FF5A1F, #FF7A47)'
                : 'linear-gradient(90deg, #005A3C, #52b48d)',
            }}
          />
        </div>
      </div>

      <div className="absolute end-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ChevronEnd size={16} className="text-pitch-400" />
      </div>
    </button>
  )
}
