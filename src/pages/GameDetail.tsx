import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Clock, Users, Share2, UserPlus, UserMinus, MessageCircle } from 'lucide-react'
import { getOccupancyPercent } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import LineupField from '../components/LineupField'

type Tab = 'info' | 'lineup'

export default function GameDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang, isRTL } = useLang()
  const { user } = useAuth()
  const { games, joinGame, leaveGame, hasJoined } = useGame()
  const [tab, setTab] = useState<Tab>('info')

  const game = games.find(g => g.id === id)

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

  const g        = game
  const joined   = hasJoined(g.id)
  const isFull   = g.status === 'full'
  const spots    = g.max_players - g.current_players
  const pct      = getOccupancyPercent(g)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const he = lang === 'he'

  const userInitials = user
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : ''

  async function handleShare() {
    const url  = window.location.href
    const text = he
      ? `הצטרף למשחק "${g.title}" ב-${g.location_name}`
      : `Join the game "${g.title}" at ${g.location_name}`
    if (navigator.share) {
      await navigator.share({ title: 'Kadur', text, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  async function handleJoinLeave() {
    if (!user) { navigate('/auth'); return }
    if (joined) await leaveGame(g.id)
    else        await joinGame(g.id)
  }

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
        <button onClick={handleShare} className="w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform">
          <Share2 size={16} />
        </button>
      </div>

      {/* Hero */}
      <div className="relative z-10 px-5 mb-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={g.format === '5v5' ? 'badge-green' : g.format === '7v7' ? 'badge-ember' : 'badge-gray'}>{g.format}</span>
            {joined && <span className="badge-green">{he ? 'נרשמת' : 'Joined'}</span>}
            {isFull ? <span className="badge-ember">{t.game.full}</span> : <span className="badge-green">{t.game.open}</span>}
          </div>
          <h1 className="font-display text-3xl tracking-wider mb-1">{g.title}</h1>
          {g.description && <p className="text-secondary text-sm font-body mb-4">{g.description}</p>}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-secondary">
              <MapPin size={14} className="text-pitch-400 flex-shrink-0" />
              <span>{g.location_name}, {g.city}</span>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <Clock size={14} className="text-ember-400 flex-shrink-0" />
              <span>{new Date(g.scheduled_at).toLocaleString(he ? 'he-IL' : 'en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="relative z-10 px-5 mb-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-pitch-400" />
              <span className="font-heading font-semibold">{g.current_players} / {g.max_players} {t.game.players}</span>
            </div>
            <span className={`text-sm font-heading font-bold ${isFull ? 'text-ember-400' : 'text-pitch-400'}`}>
              {isFull ? t.game.no_spots : `${spots} ${spots === 1 ? t.game.spot_left : t.game.spots_left}`}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width:      `${pct}%`,
              background: isFull ? 'linear-gradient(90deg, #FF5A1F, #FF7A47)' : 'linear-gradient(90deg, #005A3C, #52b48d)',
              boxShadow:  isFull ? '0 0 8px rgba(255,90,31,0.4)' : '0 0 8px rgba(82,180,141,0.4)',
            }} />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex rounded-xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { id: 'info',   labelHe: '📋 פרטים',  labelEn: '📋 Info'   },
            { id: 'lineup', labelHe: '⚽ הרכב',    labelEn: '⚽ Lineup' },
          ] as { id: Tab; labelHe: string; labelEn: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-heading font-bold transition-all duration-200"
              style={{
                background: tab === t.id ? 'linear-gradient(135deg, #007a50, #005A3C)' : 'transparent',
                color:      tab === t.id ? '#fff' : 'rgba(240,244,242,0.45)',
                boxShadow:  tab === t.id ? '0 4px 12px rgba(0,90,60,0.3)' : 'none',
              }}
            >
              {he ? t.labelHe : t.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* ── INFO TAB ── */}
      {tab === 'info' && (
        <div className="relative z-10 px-5 space-y-4">
          {/* Joined players list */}
          {(g.participant_ids?.length ?? 0) > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted mb-3">
                {he ? 'שחקנים רשומים' : 'Registered players'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(g.participant_ids ?? []).map((uid, i) => {
                  const colors = ['#52b48d','#FF7A47','#8ecfb4','#FFB347','#87CEEB','#DDA0DD']
                  const color  = uid === user?.id ? '#00c36b' : colors[i % colors.length]
                  const isMe   = uid === user?.id
                  return (
                    <div key={uid}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-heading font-bold"
                      style={{
                        background: color + '33',
                        border:     `2px solid ${color}`,
                        color,
                        boxShadow:  isMe ? `0 0 8px ${color}88` : 'none',
                      }}
                      title={isMe ? (he ? 'אתה' : 'You') : uid.slice(0, 6)}
                    >
                      {isMe ? userInitials : '#'}
                    </div>
                  )
                })}
                {/* Empty spots */}
                {Array.from({ length: Math.max(0, g.max_players - (g.participant_ids?.length ?? 0)) }).slice(0, 6).map((_, i) => (
                  <div key={`empty-${i}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.12)' }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LINEUP TAB ── */}
      {tab === 'lineup' && user && (
        <div className="relative z-10">
          <LineupField
            game={g}
            userId={user.id}
            userName={user.name}
            userInitials={userInitials}
            isJoined={joined}
            lang={lang}
          />
        </div>
      )}

      {/* Actions — always visible */}
      <div className="relative z-10 px-5 mt-5 flex gap-3">
        {(!isFull || joined) && (
          <button
            onClick={handleJoinLeave}
            className={joined
              ? 'btn-ghost flex-1 flex items-center justify-center gap-2 py-4'
              : 'btn-primary flex-1 flex items-center justify-center gap-2 py-4'}
          >
            {joined
              ? <><UserMinus size={17} />{he ? 'עזוב' : 'Leave'}</>
              : <><UserPlus  size={17} />{t.game.join}</>}
          </button>
        )}
        <button
          onClick={() => navigate(`/game/${g.id}/chat`)}
          className="btn-ghost flex items-center justify-center gap-2 py-4 px-5"
        >
          <MessageCircle size={17} />
          {t.game.chat}
        </button>
      </div>
    </div>
  )
}
