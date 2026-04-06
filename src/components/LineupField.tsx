import { useRef } from 'react'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db, FIREBASE_READY } from '../lib/firebase'
import type { Game, LineupSpot, GameRole } from '../types'

// ── Predefined game-day roles ────────────────────────────────────────────────
export const GAME_ROLES: { id: string; emoji: string; he: string; en: string }[] = [
  { id: 'ball',      emoji: '⚽', he: 'מביא כדור',   en: 'Bring ball'   },
  { id: 'bibs',      emoji: '🦺', he: 'גופיות',       en: 'Bibs/Vests'  },
  { id: 'pump',      emoji: '💨', he: 'משאבה',         en: 'Pump'         },
  { id: 'cones',     emoji: '🔶', he: 'חרוטים',        en: 'Cones'        },
  { id: 'water',     emoji: '💧', he: 'שתייה',         en: 'Drinks'       },
  { id: 'referee',   emoji: '🟨', he: 'שופט',          en: 'Referee'      },
]

// ── Avatar colours cycling ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#52b48d', '#FF7A47', '#8ecfb4', '#FFB347',
  '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
]
function colorFor(uid: string) {
  let h = 0; for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  game:      Game
  userId:    string
  userName:  string
  userInitials: string
  isJoined:  boolean
  lang:      'he' | 'en'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LineupField({ game, userId, userName, userInitials, isJoined, lang }: Props) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const he = lang === 'he'
  const lineup     = game.lineup     ?? {}
  const game_roles = game.game_roles ?? {}
  const mySpot     = lineup[userId]

  // ── Place / move / remove self on pitch ──────────────────────────────────
  async function handleFieldTap(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) {
    if (!isJoined || !FIREBASE_READY) return
    const el   = fieldRef.current!
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY
    const x = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width)  * 100))
    const y = Math.max(4, Math.min(96, ((clientY - rect.top)  / rect.height) * 100))

    const spot: LineupSpot = { x, y, name: userName, initials: userInitials }
    await updateDoc(doc(db, 'games', game.id), { [`lineup.${userId}`]: spot })
  }

  async function removeMySpot() {
    if (!FIREBASE_READY) return
    await updateDoc(doc(db, 'games', game.id), {
      [`lineup.${userId}`]: deleteField(),
    })
  }

  // ── Claim / release a role ────────────────────────────────────────────────
  async function toggleRole(roleId: string) {
    if (!isJoined || !FIREBASE_READY) return
    const current = game_roles[roleId] as GameRole | undefined
    if (current?.userId === userId) {
      // release
      await updateDoc(doc(db, 'games', game.id), { [`game_roles.${roleId}`]: deleteField() })
    } else if (!current) {
      // claim
      await updateDoc(doc(db, 'games', game.id), {
        [`game_roles.${roleId}`]: { userId, userName },
      })
    }
  }

  const playerCount = Object.keys(lineup).length

  return (
    <div className="space-y-4">
      {/* ── Pitch ─────────────────────────────────────────────── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted">
            {he ? 'סדר עצמך במגרש' : 'Place yourself on the pitch'}
          </p>
          {playerCount > 0 && (
            <span className="text-[10px] font-heading text-secondary">
              {playerCount} {he ? 'שחקנים' : 'players'}
            </span>
          )}
        </div>

        {/* Field wrapper */}
        <div
          className="relative w-full rounded-2xl overflow-hidden select-none"
          style={{ aspectRatio: '2/3', cursor: isJoined ? 'crosshair' : 'default' }}
          ref={fieldRef}
          onClick={handleFieldTap}
          onTouchEnd={handleFieldTap}
        >
          {/* Grass */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #1a4a2e 0%, #1e5535 25%, #1a4a2e 50%, #1e5535 75%, #1a4a2e 100%)',
          }} />

          {/* Pitch lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            {/* Outer border */}
            <rect x="10" y="10" width="180" height="280" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" rx="1"/>
            {/* Center line */}
            <line x1="10" y1="150" x2="190" y2="150" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Center circle */}
            <circle cx="100" cy="150" r="28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            <circle cx="100" cy="150" r="2" fill="rgba(255,255,255,0.5)"/>
            {/* Top penalty box */}
            <rect x="45" y="10" width="110" height="55" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Top 6-yard box */}
            <rect x="72" y="10" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Top penalty spot */}
            <circle cx="100" cy="47" r="1.5" fill="rgba(255,255,255,0.5)"/>
            {/* Top penalty arc */}
            <path d="M 72 65 Q 100 85 128 65" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Bottom penalty box */}
            <rect x="45" y="235" width="110" height="55" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Bottom 6-yard box */}
            <rect x="72" y="268" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Bottom penalty spot */}
            <circle cx="100" cy="253" r="1.5" fill="rgba(255,255,255,0.5)"/>
            {/* Bottom penalty arc */}
            <path d="M 72 235 Q 100 215 128 235" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
            {/* Goals */}
            <rect x="82" y="5" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
            <rect x="82" y="287" width="36" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
          </svg>

          {/* Player pins */}
          {Object.entries(lineup).map(([uid, spot]) => {
            const isMe    = uid === userId
            const color   = isMe ? '#00c36b' : colorFor(uid)
            const size    = isMe ? 34 : 30
            return (
              <div
                key={uid}
                className="absolute flex flex-col items-center pointer-events-none"
                style={{
                  left:      `${spot.x}%`,
                  top:       `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex:    isMe ? 10 : 5,
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center font-heading font-bold text-[10px] text-white shadow-lg"
                  style={{
                    width:     size,
                    height:    size,
                    background: color,
                    border:    isMe ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.4)',
                    boxShadow: isMe ? `0 0 12px ${color}88` : '0 2px 6px rgba(0,0,0,0.4)',
                  }}
                >
                  {spot.initials.slice(0, 2)}
                </div>
                <div className="mt-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-heading font-bold"
                  style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', whiteSpace: 'nowrap', maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {spot.name.split(' ')[0]}
                </div>
              </div>
            )
          })}

          {/* Hint when not on pitch yet */}
          {isJoined && !mySpot && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-xl text-xs font-heading text-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
                {he ? '👆 לחץ על המגרש למקם את עצמך' : '👆 Tap the pitch to place yourself'}
              </div>
            </div>
          )}

          {/* Not-joined overlay */}
          {!isJoined && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.35)' }}>
              <div className="px-4 py-2 rounded-xl text-xs font-heading text-center"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
                {he ? 'הצטרף למשחק כדי להופיע בהרכב' : 'Join the game to appear in the lineup'}
              </div>
            </div>
          )}
        </div>

        {/* Remove self button */}
        {mySpot && isJoined && (
          <button
            onClick={e => { e.stopPropagation(); removeMySpot() }}
            className="mt-2 w-full py-2 rounded-xl text-xs font-heading font-semibold"
            style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff6b6b' }}
          >
            {he ? 'הסר אותי מהמגרש' : 'Remove me from pitch'}
          </button>
        )}
      </div>

      {/* ── Game-day roles ───────────────────────────────────────── */}
      <div className="px-5">
        <p className="text-xs font-heading font-bold uppercase tracking-widest text-muted mb-3">
          {he ? 'תפקידי משחק' : 'Game-day roles'}
        </p>
        <div className="space-y-2">
          {GAME_ROLES.map(role => {
            const claimed   = game_roles[role.id] as GameRole | undefined
            const isMine    = claimed?.userId === userId
            const isTaken   = !!claimed && !isMine
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                disabled={isTaken || !isJoined}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 active:scale-[0.98] text-start"
                style={{
                  background: isMine   ? 'rgba(0,195,107,0.15)'
                            : isTaken  ? 'rgba(255,255,255,0.04)'
                            : 'rgba(255,255,255,0.06)',
                  border:     isMine   ? '1px solid rgba(0,195,107,0.4)'
                            : isTaken  ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(255,255,255,0.1)',
                  opacity:    isTaken  ? 0.6 : 1,
                  cursor:     isTaken || !isJoined ? 'default' : 'pointer',
                }}
              >
                <span className="text-xl w-7 text-center flex-shrink-0">{role.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-bold leading-tight">
                    {he ? role.he : role.en}
                  </p>
                  {claimed && (
                    <p className="text-[10px] font-body text-secondary truncate mt-0.5">
                      {isMine
                        ? (he ? 'אתה לקחת את זה ✓' : 'You claimed this ✓')
                        : claimed.userName}
                    </p>
                  )}
                </div>
                {!claimed && isJoined && (
                  <span className="text-[10px] font-heading flex-shrink-0 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(82,180,141,0.15)', color: '#52b48d', border: '1px solid rgba(82,180,141,0.25)' }}>
                    {he ? 'קח' : 'Claim'}
                  </span>
                )}
                {isMine && (
                  <span className="text-[10px] font-heading flex-shrink-0 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,59,48,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,59,48,0.2)' }}>
                    {he ? 'שחרר' : 'Release'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {!isJoined && (
          <p className="text-center text-xs text-muted mt-3 font-body">
            {he ? 'הצטרף למשחק כדי לקחת תפקיד' : 'Join the game to claim a role'}
          </p>
        )}
      </div>
    </div>
  )
}
