import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Clock, Users, Share2, UserPlus, MessageCircle, Trophy } from 'lucide-react'
import { mockGames, getOccupancyPercent } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'

const positionColors: Record<string, string> = {
  GK: '#FF5A1F', DEF: '#005A3C', MID: '#52b48d', FWD: '#FF7A47', ANY: '#8ecfb4',
}

const mockPlayers = [
  { id: '1', name: 'אבי כהן',    nameEn: 'Avi Cohen',    position: 'GK',  team: 'A', initials: 'א.כ' },
  { id: '2', name: 'נועה לוי',    nameEn: 'Noa Levi',     position: 'DEF', team: 'A', initials: 'נ.ל' },
  { id: '3', name: 'בן שחר',     nameEn: 'Ben Shahar',   position: 'MID', team: 'A', initials: 'ב.ש' },
  { id: '4', name: 'דנה פרץ',    nameEn: 'Dana Peretz',  position: 'FWD', team: 'A', initials: 'ד.פ' },
  { id: '5', name: 'יעל מזרחי',   nameEn: 'Yael Mizrahi', position: 'DEF', team: 'B', initials: 'י.מ' },
  { id: '6', name: 'ערן כץ',     nameEn: 'Eran Katz',    position: 'MID', team: 'B', initials: 'ע.כ' },
  { id: '7', name: 'ליאור קדוש',  nameEn: 'Lior Kadosh',  position: 'MID', team: 'B', initials: 'ל.ק' },
]

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang, isRTL } = useLang()
  const game = mockGames.find(g => g.id === id)

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-heading text-2xl mb-2">{t.game.not_found}</p>
          <button className="btn-ghost" onClick={() => navigate('/')}>{t.game.go_home}</button>
        </div>
      </div>
    )
  }

  const isFull = game.status === 'full'
  const spots  = game.max_players - game.current_players
  const pct    = getOccupancyPercent(game)
  const teamA  = mockPlayers.filter(p => p.team === 'A')
  const teamB  = mockPlayers.filter(p => p.team === 'B')
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="hex-pattern absolute inset-0 opacity-30" />
      </div>

      {/* Back bar */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform">
          <BackIcon size={18} />
        </button>
        <button className="w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform">
          <Share2 size={16} />
        </button>
      </div>

      {/* Hero */}
      <div className="relative z-10 px-5 mb-5">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={game.format === '5v5' ? 'badge-green' : game.format === '7v7' ? 'badge-ember' : 'badge-gray'}>{game.format}</span>
            {isFull ? <span className="badge-ember">{t.game.full}</span> : <span className="badge-green">{t.game.open}</span>}
          </div>
          <h1 className="font-display text-3xl tracking-wider mb-1">{game.title}</h1>
          {game.description && <p className="text-secondary text-sm font-body mb-4">{game.description}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-secondary">
              <MapPin size={14} className="text-pitch-400 flex-shrink-0" />
              <span>{game.location_name}, {game.city}</span>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <Clock size={14} className="text-ember-400 flex-shrink-0" />
              <span>{new Date(game.scheduled_at).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Occupancy */}
      <div className="relative z-10 px-5 mb-5">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-pitch-400" />
              <span className="font-heading font-semibold">{game.current_players} / {game.max_players} {t.game.players}</span>
            </div>
            <span className={`text-sm font-heading font-bold ${isFull ? 'text-ember-400' : 'text-pitch-400'}`}>
              {isFull ? t.game.no_spots : `${spots} ${spots === 1 ? t.game.spot_left : t.game.spots_left}`}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: isFull ? 'linear-gradient(90deg, #FF5A1F, #FF7A47)' : 'linear-gradient(90deg, #005A3C, #52b48d)',
                boxShadow: isFull ? '0 0 8px rgba(255,90,31,0.4)' : '0 0 8px rgba(82,180,141,0.4)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Lineup */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-ember-400" />
          <h2 className="font-heading font-bold text-sm uppercase tracking-wider">{t.game.lineup}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: t.game.team_a, color: '#52b48d', border: 'rgba(82,180,141,0.2)', players: teamA },
            { label: t.game.team_b, color: '#FF7A47', border: 'rgba(255,122,71,0.2)',  players: teamB }].map(({ label, color, border, players }) => (
            <div key={label} className="glass-card p-3">
              <div className="text-xs font-heading font-bold uppercase tracking-widest mb-3 pb-2" style={{ color, borderBottom: `1px solid ${border}` }}>
                {label}
              </div>
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0"
                      style={{ background: `${positionColors[p.position]}22`, border: `1px solid ${positionColors[p.position]}44`, color: positionColors[p.position] }}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-body font-medium truncate">{lang === 'he' ? p.name : p.nameEn}</p>
                      <p className="text-[10px] font-heading font-semibold tracking-wider" style={{ color: positionColors[p.position] }}>
                        {t.positions[p.position as keyof typeof t.positions]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="relative z-10 px-5 flex gap-3">
        {!isFull && (
          <button className="btn-primary flex-1 flex items-center justify-center gap-2 py-4">
            <UserPlus size={17} />
            {t.game.join}
          </button>
        )}
        <button className="btn-ghost flex items-center justify-center gap-2 py-4 px-5">
          <MessageCircle size={17} />
          {t.game.chat}
        </button>
      </div>
    </div>
  )
}
