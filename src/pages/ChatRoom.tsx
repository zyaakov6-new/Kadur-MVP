import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send, Users } from 'lucide-react'
import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db, FIREBASE_READY } from '../lib/firebase'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'

interface ChatMessage {
  id:       string
  sender:   string
  initials: string
  text:     string
  time:     string
  mine:     boolean
}

// ── Bot simulation (dev fallback only) ──────────────────────────────────────
const BOT_NAMES = [
  { name: 'אבי כהן', nameEn: 'Avi Cohen',  initials: 'א.כ' },
  { name: 'נועה לוי', nameEn: 'Noa Levi',   initials: 'נ.ל' },
  { name: 'בן שחר',  nameEn: 'Ben Shahar', initials: 'ב.ש' },
]
const SEED_HE = ['מישהו מביא כדור? 🔵','אני בדרך! 🏃','מה הסיטואציה עם חולצות?','כבר 6 שחקנים אישרו 🔥','מי שוער הלילה?','מגרש פנוי, 19:30 חד!']
const SEED_EN = ['Anyone bringing a ball? 🔵',"On my way! 🏃","What's the situation with bibs?",'6 players confirmed 🔥',"Who's in goal tonight?",'Pitch is free, 19:30 sharp!']

function makeId() { return Math.random().toString(36).slice(2) }
function chatKey(gid: string) { return `kadur-chat-${gid}` }

function tsToStr(ts: Timestamp | string | null | undefined): string {
  if (!ts) return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const d = typeof ts === 'string' ? new Date(ts) : (ts as Timestamp).toDate?.() ?? new Date()
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function initBotMessages(lang: string): ChatMessage[] {
  const seeds = lang === 'he' ? SEED_HE : SEED_EN
  return seeds.slice(0, 3).map((text, i) => ({
    id:       makeId(),
    sender:   lang === 'he' ? BOT_NAMES[i].name : BOT_NAMES[i].nameEn,
    initials: BOT_NAMES[i].initials,
    text,
    time:     new Date(Date.now() - [14, 8, 3][i] * 60000)
                .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    mine:     false,
  }))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatRoom() {
  const { id }             = useParams()
  const navigate           = useNavigate()
  const { lang, isRTL, t } = useLang()
  const { user }           = useAuth()
  const { games, markChatRead } = useGame()

  const game   = games.find(g => g.id === id)
  const seeds  = lang === 'he' ? SEED_HE : SEED_EN
  const bottom = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages]   = useState<ChatMessage[]>(() =>
    FIREBASE_READY ? [] : initBotMessages(lang)
  )
  const [input, setInput]         = useState('')
  const [typing, setTyping]       = useState<string | null>(null)
  const [online]                  = useState(3 + Math.floor(Math.random() * 4))
  const [loadingMsgs, setLoading] = useState(FIREBASE_READY)

  // Mark chat as read on mount
  useEffect(() => { if (id) markChatRead(id) }, [id])  // eslint-disable-line

  // ── Firebase: real-time message subscription ─────────────────────────────
  useEffect(() => {
    if (!FIREBASE_READY || !id) return

    const q = query(
      collection(db, 'games', id, 'messages'),
      orderBy('created_at', 'asc')
    )

    const unsub = onSnapshot(q, snapshot => {
      if (snapshot.empty) {
        setMessages([])   // real empty chat — no fake seeds
      } else {
        setMessages(snapshot.docs.map(d => {
          const data = d.data()
          return {
            id:       d.id,
            sender:   data.sender_name as string,
            initials: (data.sender_initials as string) ?? (data.sender_name as string).slice(0, 2),
            text:     data.content as string,
            time:     tsToStr(data.created_at as Timestamp),
            mine:     data.sender_id === user?.id,
          }
        }))
      }
      setLoading(false)
    }, () => {
      setMessages(initBotMessages(lang))
      setLoading(false)
    })

    return unsub
  }, [id, user?.id, lang])  // eslint-disable-line

  // ── Dev fallback: persist to localStorage ────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_READY && id) {
      localStorage.setItem(chatKey(id), JSON.stringify(messages))
    }
  }, [messages, id])

  // ── Dev fallback: bot simulation ─────────────────────────────────────────
  useEffect(() => {
    if (FIREBASE_READY) return
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    function next() {
      t1 = setTimeout(() => {
        const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
        setTyping(lang === 'he' ? bot.name : bot.nameEn)
        t2 = setTimeout(() => {
          setTyping(null)
          setMessages(prev => [...prev, {
            id: makeId(), sender: lang === 'he' ? bot.name : bot.nameEn,
            initials: bot.initials, text: seeds[Math.floor(Math.random() * seeds.length)],
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), mine: false,
          }])
          next()
        }, 1500 + Math.random() * 1000)
      }, 8000 + Math.random() * 7000)
    }
    next()
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [lang])

  // Auto-scroll
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // ── Send ─────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim()
    if (!text || !user) return
    setInput('')
    inputRef.current?.focus()

    const initials = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()

    if (!FIREBASE_READY) {
      setMessages(prev => [...prev, {
        id: makeId(), sender: user.name, initials, text,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), mine: true,
      }])
      const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
      const replies = lang === 'he'
        ? ['👍','ברור!','אחלה!','נשמע טוב 🔥','אוקיי!']
        : ['👍','Got it!','Nice!','Sounds good 🔥','OK!']
      setTimeout(() => {
        setTyping(lang === 'he' ? bot.name : bot.nameEn)
        setTimeout(() => {
          setTyping(null)
          setMessages(prev => [...prev, {
            id: makeId(), sender: lang === 'he' ? bot.name : bot.nameEn,
            initials: bot.initials, text: replies[Math.floor(Math.random() * replies.length)],
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), mine: false,
          }])
        }, 1200)
      }, 2000 + Math.random() * 2000)
      return
    }

    await addDoc(collection(db, 'games', id!, 'messages'), {
      sender_id:       user.id,
      sender_name:     user.name,
      sender_initials: initials,
      content:         text,
      created_at:      serverTimestamp(),
    })
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  if (!game) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e0c' }}>
      <button className="btn-ghost" onClick={() => navigate(-1)}>{t.game.go_home}</button>
    </div>
  )

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0e0c' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0 opacity-60" />
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center gap-3 px-4 pt-14 pb-3"
        style={{ background: 'rgba(10,14,12,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 glass-card flex items-center justify-center active:scale-90 transition-transform flex-shrink-0">
          <BackIcon size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(0,90,60,0.4), rgba(0,90,60,0.15))', border: '1px solid rgba(0,90,60,0.3)' }}>
          ⚽
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold text-sm truncate leading-tight">{game.title}</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-heading text-secondary">
              {online} {lang === 'he' ? 'מחוברים' : 'online'}
            </span>
          </div>
        </div>
        <button onClick={() => navigate(`/game/${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold"
          style={{ background: 'rgba(0,90,60,0.2)', border: '1px solid rgba(0,90,60,0.3)', color: '#52b48d' }}>
          <Users size={11} />
          {game.current_players}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative z-10">
        {loadingMsgs ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-6 h-6 rounded-full border-2 border-pitch-400/30 border-t-pitch-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-center">
            <span className="text-4xl">⚽</span>
            <p className="font-heading font-bold text-sm">
              {lang === 'he' ? 'אין הודעות עדיין' : 'No messages yet'}
            </p>
            <p className="text-secondary text-xs">
              {lang === 'he' ? 'היה הראשון לכתוב!' : 'Be the first to say something!'}
            </p>
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.mine ? 'flex-row-reverse' : 'flex-row'}`}>
            {!msg.mine && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0 mb-0.5"
                style={{ background: 'rgba(82,180,141,0.2)', border: '1px solid rgba(82,180,141,0.3)', color: '#52b48d' }}>
                {msg.initials}
              </div>
            )}
            <div className={`max-w-[72%] ${msg.mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
              {!msg.mine && <span className="text-[10px] font-heading text-muted px-1">{msg.sender}</span>}
              <div className="px-3.5 py-2.5 rounded-2xl font-body text-sm leading-relaxed"
                style={msg.mine ? {
                  background: 'linear-gradient(135deg, #007a50, #005A3C)',
                  borderEndEndRadius: '4px', color: '#fff',
                } : {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderEndStartRadius: '4px', color: '#f0f4f2',
                }}>
                {msg.text}
              </div>
              <span className="text-[9px] font-heading text-muted px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0 mb-0.5"
              style={{ background: 'rgba(82,180,141,0.2)', border: '1px solid rgba(82,180,141,0.3)', color: '#52b48d' }}>…</div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-heading text-muted px-1">{typing}</span>
              <div className="px-3.5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderEndStartRadius: '4px' }}>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-pitch-400"
                      style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {/* Input bar */}
      <div className="relative z-20 px-4 py-3 flex items-center gap-2"
        style={{ background: 'rgba(10,14,12,0.90)', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={lang === 'he' ? 'הקלד הודעה…' : 'Type a message…'}
          className="flex-1 rounded-2xl px-4 py-3 font-body text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#f0f4f2' }} />
        <button onClick={sendMessage} disabled={!input.trim()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #007a50, #005A3C)' : 'rgba(255,255,255,0.06)',
            boxShadow:  input.trim() ? '0 4px 16px rgba(0,90,60,0.4)' : 'none',
          }}>
          <Send size={16} style={{ color: input.trim() ? '#fff' : 'rgba(240,244,242,0.3)' }} />
        </button>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}
