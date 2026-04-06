import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Mail, Lock } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

type Tab = 'signin' | 'signup'

const POSITIONS = [
  { value: 'GK',  labelHe: 'שוער',    labelEn: 'Goalkeeper' },
  { value: 'DEF', labelHe: 'מגן',     labelEn: 'Defender'   },
  { value: 'MID', labelHe: 'קשר',     labelEn: 'Midfielder' },
  { value: 'FWD', labelHe: 'חלוץ',    labelEn: 'Forward'    },
  { value: 'ANY', labelHe: 'כל עמדה', labelEn: 'Any'        },
]

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, isRTL, toggleLang } = useLang()
  const { login, user } = useAuth()
  const he = lang === 'he'

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user])  // eslint-disable-line

  const defaultTab: Tab = (location.state as { tab?: Tab })?.tab ?? 'signin'
  const [tab, setTab]           = useState<Tab>(defaultTab)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const [siEmail, setSiEmail] = useState('')
  const [siPass,  setSiPass]  = useState('')

  const [suName,  setSuName]  = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPass,  setSuPass]  = useState('')
  const [suCity,  setSuCity]  = useState('')
  const [suPos,   setSuPos]   = useState('MID')

  async function handleSignIn() {
    if (!siEmail || !siPass) { setError(he ? 'מלא את כל השדות' : 'Fill in all fields'); return }
    setError(''); setLoading(true)
    const result = await login({ email: siEmail, name: siEmail.split('@')[0], password: siPass, isNewUser: false })
    setLoading(false)
    if (result.error) setError(result.error)
  }

  async function handleSignUp() {
    if (!suName || !suEmail || !suPass) { setError(he ? 'מלא את כל השדות' : 'Fill in all fields'); return }
    if (suPass.length < 6) { setError(he ? 'סיסמה חייבת להיות לפחות 6 תווים' : 'Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    const result = await login({ email: suEmail, name: suName, city: suCity, position: suPos, password: suPass, isNewUser: true })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/', { replace: true })
  }

  const ChevronIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <div
      className="min-h-screen flex flex-col px-5 relative overflow-hidden"
      style={{ background: '#0a0e0c' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="gradient-radial-ember absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 flex justify-end pt-14">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <span className="text-sm">{he ? '🇮🇱' : '🇬🇧'}</span>
          <span className="text-xs font-heading font-bold" style={{ color: '#52b48d' }}>
            {he ? 'EN' : 'עב'}
          </span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mt-6 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: 'linear-gradient(135deg, #007a50, #005A3C)', boxShadow: '0 0 40px rgba(0,90,60,0.45)' }}
        >
          <span className="font-display text-3xl text-white">כ</span>
        </div>
        <h1 className="font-display text-4xl tracking-wider" style={{ color: '#52b48d' }}>KADUR</h1>
        <p className="text-muted text-xs font-body mt-1">
          {he ? 'משחק הפיקאפ הטוב בעולם' : "The world's best pickup football app"}
        </p>
      </div>

      <div
        className="relative z-10 flex rounded-2xl p-1 mb-5"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {(['signin', 'signup'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className="flex-1 py-2.5 rounded-xl text-sm font-heading font-bold uppercase tracking-wider transition-all duration-250"
            style={{
              background: tab === t ? 'linear-gradient(135deg, #007a50, #005A3C)' : 'transparent',
              color: tab === t ? '#fff' : 'rgba(240,244,242,0.4)',
              boxShadow: tab === t ? '0 4px 16px rgba(0,90,60,0.35)' : 'none',
            }}
          >
            {t === 'signin' ? (he ? 'כניסה' : 'Sign In') : (he ? 'הרשמה' : 'Sign Up')}
          </button>
        ))}
      </div>

      {/* ── SIGN IN ── */}
      {tab === 'signin' && (
        <div className="relative z-10 glass-card p-5 space-y-3">
          <div>
            <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
              {he ? 'אימייל' : 'Email'}
            </label>
            <div className="relative">
              <Mail size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineStart: '14px' }} />
              <input type="email" value={siEmail} onChange={e => setSiEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                placeholder="your@email.com" className="input-glass"
                style={{ paddingInlineStart: '38px' }} autoComplete="email" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
              {he ? 'סיסמה' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineStart: '14px' }} />
              <input type={showPass ? 'text' : 'password'} value={siPass} onChange={e => setSiPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                placeholder="••••••••" className="input-glass"
                style={{ paddingInlineStart: '38px', paddingInlineEnd: '42px' }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute top-1/2 -translate-y-1/2 text-muted" style={{ insetInlineEnd: '14px' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-body bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button onClick={handleSignIn} disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-1">
            {loading
              ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <>{he ? 'כניסה' : 'Sign In'} <ChevronIcon size={16} /></>
            }
          </button>

          <p className="text-center text-xs text-secondary font-body pt-1">
            {he ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
            <button onClick={() => { setTab('signup'); setError('') }} className="font-semibold" style={{ color: '#52b48d' }}>
              {he ? 'הרשמה' : 'Sign up'}
            </button>
          </p>
        </div>
      )}

      {/* ── SIGN UP ── */}
      {tab === 'signup' && (
        <div className="relative z-10 glass-card p-5 space-y-3">
          <div>
            <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
              {he ? 'שם מלא' : 'Full Name'} *
            </label>
            <div className="relative">
              <User size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineStart: '14px' }} />
              <input type="text" value={suName} onChange={e => setSuName(e.target.value)}
                placeholder={he ? 'ליאו מסי' : 'Lionel Messi'} className="input-glass"
                style={{ paddingInlineStart: '38px' }} autoComplete="name" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
              {he ? 'אימייל' : 'Email'} *
            </label>
            <div className="relative">
              <Mail size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineStart: '14px' }} />
              <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)}
                placeholder="your@email.com" className="input-glass"
                style={{ paddingInlineStart: '38px' }} autoComplete="email" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
              {he ? 'סיסמה' : 'Password'} *
            </label>
            <div className="relative">
              <Lock size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineStart: '14px' }} />
              <input type={showPass ? 'text' : 'password'} value={suPass} onChange={e => setSuPass(e.target.value)}
                placeholder="••••••••" className="input-glass"
                style={{ paddingInlineStart: '38px', paddingInlineEnd: '42px' }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute top-1/2 -translate-y-1/2 text-muted" style={{ insetInlineEnd: '14px' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
                {he ? 'עיר' : 'City'}
              </label>
              <input type="text" value={suCity} onChange={e => setSuCity(e.target.value)}
                placeholder={he ? 'תל אביב' : 'Tel Aviv'} className="input-glass" autoComplete="address-level2" />
            </div>
            <div>
              <label className="block text-[10px] font-heading font-semibold uppercase tracking-widest text-muted mb-1.5">
                {he ? 'עמדה' : 'Position'}
              </label>
              <select value={suPos} onChange={e => setSuPos(e.target.value)}
                className="input-glass appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {POSITIONS.map(p => (
                  <option key={p.value} value={p.value} style={{ background: '#0f1510' }}>
                    {he ? p.labelHe : p.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-body bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button onClick={handleSignUp} disabled={loading}
            className="btn-ember w-full py-4 flex items-center justify-center gap-2 mt-1">
            {loading
              ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <>{he ? '⚽ צור חשבון' : '⚽ Create Account'}</>
            }
          </button>

          <p className="text-center text-xs text-secondary font-body pt-1">
            {he ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
            <button onClick={() => { setTab('signin'); setError('') }} className="font-semibold" style={{ color: '#52b48d' }}>
              {he ? 'כניסה' : 'Sign in'}
            </button>
          </p>
        </div>
      )}

      <p className="relative z-10 text-center text-[10px] font-body text-muted mt-5 mb-8 px-4">
        {he
          ? 'בהמשך אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו'
          : 'By continuing you agree to our Terms of Service and Privacy Policy'}
      </p>
    </div>
  )
}
