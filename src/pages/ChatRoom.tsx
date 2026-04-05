import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send, Users } from 'lucide-react'
import { mockGames } from '../data/mockData'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

interface ChatMessage {
  id: string
  sender: string
  initials: string
  text: string
  time: string
  mine: boolean
  isSystem?: boolean
}

const BOT_NAMES = [
  { name: 'אבי כהן',   nameEn: 'Avi Cohen',   initials: 'א.כ', color: '#52b48d' },
  { name: 'נועה לוי',   nameEn: 'Noa Levi',    initials: 'נ.ל', color: '#FF7A47' },
  { name: 'בן שחר',    nameEn: 'Ben Shahar',   initials: 'ב.ש', color: '#8ecfb4' },
]

const SEED_HE = [
  'מישהו מביא כדור? 🔵',
  'אני בדרך! 🏃',
  'מה הסיטואציה עם חולצות?',
  'כבר 6 שחקנים אישרו 🔥',
  'מי שוער הלילה?',
  'מגרש פנוי, 19:30 חד!',
]
const SEED_EN = [
  'Anyone bringing a ball? 🔵',
  'On my way! 🏃',
  'What\'s the situation with bibs?',
  '6 players confirmed 🔥',
  'Who\'s in goal tonight?',
  'Pitch is free, 19:30 sharp!',
]

function makeId() { return Math.random().toString(36).slice(2) }

function nowTime() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang, isRTL, t } = useLang()
  const { user } = useAuth()

  const game   = mockGames.find(g => g.id === id)
  const seeds  = lang === 'he' ? SEED_HE : SEED_EN
  const bottom = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial: ChatMessage[] = seeds.slice(0, 3).map((text, i) => ({
      id: makeId(),
      sender:   lang === 'he' ? BOT_NAMES[i % 3].name : BOT_NAMES[i % 3].nameEn,
      initials: BOT_NAMES[i % 3].initials,
      text,
      time: nowTime(),
      mine: false,
    }))
    return initial
  })
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState<string | null>(null)
  const [online]                = useState(3 + Math.floor(Math.random() * 4))

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Simulate incoming messages every 8–15 seconds
  useEffect(() => {
    let typingTimer: ReturnType<typeof setTimeout>
    let msgTimer: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = 8000 + Math.random() * 7000
      typingTimer = setTimeout(() => {
        const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
        setTyping(lang === 'he' ? bot.name : bot.nameEn)
        msgTimer = setTimeout(() => {
          setTyping(null)
          const text = seeds[Math.floor(Math.random() * seeds.length)]
          setMessages(prev => [...prev, {
            id: makeId(),
            sender:   lang === 'he' ? bot.name : bot.nameEn,
            initials: bot.initials,
            text,
            time: nowTime(),
            mine: false,
          }])
          scheduleNext()
        }, 1500 + Math.random() * 1000)
      }, delay)
    }
    scheduleNext()
    return () => { clearTimeout(typingTimer); clearTimeout(msgTimer) }
  }, [lang])

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, {
      id: makeId(),
      sender:   user?.name ?? 'You',
      initials: user?.name.split(' ').map(n => n[0]).join('') ?? '?',
      text,
      time: nowTime(),
      mine: true,
    }])
    setInput('')
    inputRef.current?.focus()

    // Simulate a reply after 2–4 seconds
    const bot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
    const replyDelay = 2000 + Math.random() * 2000
    const replyTexts = lang === 'he'
      ? ['👍', 'ברור!', 'אחלה!', 'נשמע טוב 🔥', 'אוקיי!']
      : ['👍', 'Got it!', 'Nice!', 'Sounds good 🔥', 'OK!']
    setTimeout(() => {
      setTyping(lang === 'he' ? bot.name : bot.nameEn)
      setTimeout(() => {
        setTyping(null)
        setMessages(prev => [...prev, {
          id: makeId(),
          sender:   lang === 'he' ? bot.name : bot.nameEn,
          initials: bot.initials,
          text: replyTexts[Math.floor(Math.random() * replyTexts.length)],
          time: nowTime(),
          mine: false,
        }])
      }, 1200)
    }, replyDelay)
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  if (!game) return (
    <div className="min-h-screen flex items-center justify-center">
      <button className="btn-ghost" onClick={() => navigate(-1)}>{t.game.go_home}</button>
    </div>
  )

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0e0c' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0 opacity-60" />
      </div>

      {/* Header */}
      <div
        className="relative z-20 flex items-center gap-3 px-4 pt-14 pb-3"
        style={{ background: 'rgba(10,14,12,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
      >
        <button onClick={() => navigate(-1)} className="w-9 h-9 glass-card flex items-center justify-center active:scale-90 transition-transform flex-shrink-0">
          <BackIcon size={16} />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(0,90,60,0.4), rgba(0,90,60,0.15))', border: '1px solid rgba(0,90,60,0.3)' }}
        >
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
        <button
          onClick={() => navigate(`/game/${id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold"
          style={{ background: 'rgba(0,90,60,0.2)', border: '1px solid rgba(0,90,60,0.3)', color: '#52b48d' }}
        >
          <Users size={11} />
          {game.current_players}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative z-10">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.mine ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {!msg.mine && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0 mb-0.5"
                style={{ background: 'rgba(82,180,141,0.2)', border: '1px solid rgba(82,180,141,0.3)', color: '#52b48d' }}
              >
                {msg.initials}
              </div>
            )}
            <div className={`max-w-[72%] ${msg.mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
              {!msg.mine && (
                <span className="text-[10px] font-heading text-muted px-1">{msg.sender}</span>
              )}
              <div
                className="px-3.5 py-2.5 rounded-2xl font-body text-sm leading-relaxed"
                style={msg.mine ? {
                  background: 'linear-gradient(135deg, #007a50, #005A3C)',
                  borderEndEndRadius: '4px',
                  color: '#fff',
                } : {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderEndStartRadius: '4px',
                  color: '#f0f4f2',
                }}
              >
                {msg.text}
              </div>
              <span className="text-[9px] font-heading text-muted px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-heading font-bold flex-shrink-0 mb-0.5"
              style={{ background: 'rgba(82,180,141,0.2)', border: '1px solid rgba(82,180,141,0.3)', color: '#52b48d' }}>
              …
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-heading text-muted px-1">{typing}</span>
              <div className="px-3.5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderEndStartRadius: '4px' }}>
                <div className="flex items-center gap-1">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-pitch-400"
                      style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {/* Input bar */}
      <div
        className="relative z-20 px-4 py-3 flex items-center gap-2"
        style={{
          background: 'rgba(10,14,12,0.90)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'calc(12px + var(--safe-bottom))',
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={lang === 'he' ? 'הקלד הודעה…' : 'Type a message…'}
          className="flex-1 rounded-2xl px-4 py-3 font-body text-sm outline-none transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#f0f4f2',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #007a50, #005A3C)' : 'rgba(255,255,255,0.06)',
            boxShadow: input.trim() ? '0 4px 16px rgba(0,90,60,0.4)' : 'none',
          }}
        >
          <Send size={16} style={{ color: input.trim() ? '#fff' : 'rgba(240,244,242,0.3)' }} />
        </button>
      </div>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
