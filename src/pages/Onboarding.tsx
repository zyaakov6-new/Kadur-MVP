import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'

const slides = [
  {
    emoji: '📍',
    titleHe: 'מצא משחק קרוב',
    titleEn: 'Find Games Near You',
    descHe: 'גלה משחקי פיקאפ באזורך. 5v5, 7v7 או 11v11 – תמיד יש מגרש שמחכה לך.',
    descEn: 'Discover pickup matches in your area. 5v5, 7v7 or 11v11 – there\'s always a pitch waiting.',
    bg: 'from-pitch-950 via-pitch-900 to-pitch-950',
    accent: '#52b48d',
    icon: (
      <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
        <circle cx="60" cy="60" r="55" fill="rgba(0,90,60,0.15)" stroke="rgba(82,180,141,0.3)" strokeWidth="1"/>
        <circle cx="60" cy="60" r="38" fill="rgba(0,90,60,0.20)" stroke="rgba(82,180,141,0.25)" strokeWidth="1"/>
        <circle cx="60" cy="60" r="22" fill="rgba(0,90,60,0.30)" stroke="rgba(82,180,141,0.4)" strokeWidth="1.5"/>
        {/* Pin */}
        <path d="M60 30 C48 30 40 39 40 50 C40 64 60 82 60 82 C60 82 80 64 80 50 C80 39 72 30 60 30Z" fill="#52b48d" opacity="0.9"/>
        <circle cx="60" cy="50" r="8" fill="#0a0e0c"/>
        {/* Pulse rings */}
        <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(82,180,141,0.15)" strokeWidth="2" className="animate-ping" style={{animationDuration:'3s'}}/>
      </svg>
    ),
  },
  {
    emoji: '⚽',
    titleHe: 'הצטרף לקבוצה',
    titleEn: 'Join the Squad',
    descHe: 'הצטרף להרכב, בחר עמדה, ושחק עם שחקנים מהאזור שלך. הכדור מחכה.',
    descEn: 'Join the lineup, pick your position, and play with local ballers. The ball is waiting.',
    bg: 'from-pitch-950 via-[#0a1208] to-pitch-950',
    accent: '#FF7A47',
    icon: (
      <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
        {/* Field */}
        <rect x="10" y="35" width="100" height="60" rx="6" fill="rgba(0,90,60,0.25)" stroke="rgba(82,180,141,0.3)" strokeWidth="1.5"/>
        <line x1="60" y1="35" x2="60" y2="95" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <circle cx="60" cy="65" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        {/* Players */}
        {[[30,52],[45,75],[75,52],[90,75]].map(([x,y],i) => (
          <g key={i}>
            <circle cx={x} cy={y-6} r="5" fill={i<2?"#52b48d":"#FF7A47"} opacity="0.9"/>
            <rect x={x-5} y={y-1} width="10" height="8" rx="3" fill={i<2?"#52b48d":"#FF7A47"} opacity="0.8"/>
          </g>
        ))}
        {/* Ball */}
        <circle cx="60" cy="65" r="6" fill="white" opacity="0.9"/>
        <path d="M57 62 L60 58 L63 62 L61.5 66 L58.5 66Z" fill="#333" opacity="0.6"/>
      </svg>
    ),
  },
  {
    emoji: '🏆',
    titleHe: 'עלה לרמה הבאה',
    titleEn: 'Level Up Your Game',
    descHe: 'צבור XP, זכה בהישגים, והפוך למצטיין. כל גול מקרב אותך לפסגה.',
    descEn: 'Earn XP, unlock achievements, and become MVP. Every goal brings you closer to the top.',
    bg: 'from-pitch-950 via-[#120a06] to-pitch-950',
    accent: '#FF5A1F',
    icon: (
      <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
        {/* Trophy */}
        <path d="M42 25 L78 25 L78 62 C78 75 70 82 60 82 C50 82 42 75 42 62Z" fill="rgba(255,90,31,0.25)" stroke="rgba(255,122,71,0.5)" strokeWidth="1.5"/>
        <rect x="53" y="82" width="14" height="14" rx="2" fill="rgba(255,90,31,0.3)" stroke="rgba(255,122,71,0.4)" strokeWidth="1"/>
        <rect x="44" y="95" width="32" height="6" rx="3" fill="rgba(255,90,31,0.4)" stroke="rgba(255,122,71,0.5)" strokeWidth="1"/>
        {/* Handles */}
        <path d="M42 32 C30 32 26 42 26 50 C26 58 32 62 42 60" fill="none" stroke="rgba(255,122,71,0.4)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M78 32 C90 32 94 42 94 50 C94 58 88 62 78 60" fill="none" stroke="rgba(255,122,71,0.4)" strokeWidth="3" strokeLinecap="round"/>
        {/* Star */}
        <path d="M60 38 L62.5 45 L70 45 L64 49 L66.5 56 L60 52 L53.5 56 L56 49 L50 45 L57.5 45Z" fill="#FF7A47" opacity="0.9"/>
        {/* XP pills */}
        {[['30','15'],['78','20'],['20','70'],['88','65']].map(([x,y],i) => (
          <g key={i}>
            <rect x={+x-12} y={+y-6} width="24" height="12" rx="6" fill="rgba(255,90,31,0.2)" stroke="rgba(255,90,31,0.4)" strokeWidth="1"/>
            <text x={x} y={+y+4} textAnchor="middle" fill="#FF7A47" fontSize="7" fontFamily="sans-serif" fontWeight="bold">+XP</text>
          </g>
        ))}
      </svg>
    ),
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const slide = slides[current]
  const isLast = current === slides.length - 1

  function goNext() {
    if (animating) return
    if (isLast) {
      localStorage.setItem('kadur-onboarded', '1')
      navigate('/login')
    } else {
      setAnimating(true)
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false) }, 300)
    }
  }

  function skip() {
    localStorage.setItem('kadur-onboarded', '1')
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 pt-16 pb-12 relative overflow-hidden"
      style={{ background: '#0a0e0c' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${slide.accent}18 0%, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 pitch-lines opacity-20 pointer-events-none" />

      {/* Skip */}
      <div className="relative z-10 w-full flex justify-end">
        <button
          onClick={skip}
          className="text-xs font-heading font-semibold uppercase tracking-widest text-secondary"
        >
          {lang === 'he' ? 'דלג' : 'Skip'}
        </button>
      </div>

      {/* Illustration */}
      <div
        className="relative z-10 w-52 h-52 transition-all duration-300"
        style={{ opacity: animating ? 0 : 1, transform: animating ? 'scale(0.9)' : 'scale(1)' }}
      >
        {slide.icon}
      </div>

      {/* Text */}
      <div
        className="relative z-10 text-center transition-all duration-300"
        style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(10px)' : 'translateY(0)' }}
      >
        <h1 className="font-display text-5xl tracking-wider mb-4" style={{ color: slide.accent }}>
          {lang === 'he' ? slide.titleHe : slide.titleEn}
        </h1>
        <p className="text-secondary font-body text-base leading-relaxed max-w-xs mx-auto">
          {lang === 'he' ? slide.descHe : slide.descEn}
        </p>
      </div>

      {/* Bottom */}
      <div className="relative z-10 w-full flex flex-col items-center gap-5">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => !animating && setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? slide.accent : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl font-heading font-bold text-base uppercase tracking-wider transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${slide.accent}dd, ${slide.accent}aa)`,
            boxShadow: `0 8px 32px ${slide.accent}40`,
          }}
        >
          {isLast
            ? (lang === 'he' ? 'בואו נשחק ⚽' : "Let's Play ⚽")
            : (lang === 'he' ? 'הבא' : 'Next')}
        </button>
      </div>
    </div>
  )
}
