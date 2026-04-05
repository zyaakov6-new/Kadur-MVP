import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { lang, isRTL } = useLang()
  const { login, user } = useAuth()

  // Already logged in → go home
  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user])

  const [step, setStep]     = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const he = lang === 'he'

  function handlePhoneSubmit() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) { setError(he ? 'מספר טלפון לא תקין' : 'Invalid phone number'); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('otp') }, 1200)
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`)
      el?.focus()
    }
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }

  function handleOtpSubmit() {
    const code = otp.join('')
    if (code.length < 6) { setError(he ? 'הזן קוד בן 6 ספרות' : 'Enter the 6-digit code'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      login({ phone: `+972${phone.replace(/\D/g, '')}` })
      setLoading(false)
      navigate('/')
    }, 1000)
  }

  const BackIcon = isRTL ? ChevronRight : ChevronLeft

  return (
    <div className="min-h-screen flex flex-col px-6 relative overflow-hidden" style={{ background: '#0a0e0c' }}>
      {/* Backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-25" />
      </div>

      {/* Back */}
      {step === 'otp' && (
        <button
          onClick={() => setStep('phone')}
          className="relative z-10 mt-14 mb-2 w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform"
        >
          <BackIcon size={18} />
        </button>
      )}

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mt-16 mb-10">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #007a50, #005A3C)',
            boxShadow: '0 0 40px rgba(0,90,60,0.4)',
          }}
        >
          <span className="font-display text-4xl text-white tracking-wider">כ</span>
        </div>
        <h1 className="font-display text-5xl tracking-wider" style={{ color: '#52b48d' }}>KADUR</h1>
        <p className="text-secondary text-sm font-body mt-1">
          {he ? 'משחק הפיקאפ הטוב בעולם' : 'The world\'s best pickup football app'}
        </p>
      </div>

      {/* Card */}
      <div className="relative z-10 glass-card p-6">
        {step === 'phone' ? (
          <>
            <h2 className="font-heading font-bold text-xl mb-1">
              {he ? 'ברוך הבא, שחקן' : 'Welcome, baller'}
            </h2>
            <p className="text-secondary text-sm font-body mb-5">
              {he ? 'הזן מספר טלפון לכניסה' : 'Enter your phone number to continue'}
            </p>

            <div className="flex gap-2 mb-4" dir="ltr">
              <div
                className="flex items-center gap-1.5 px-3 rounded-xl font-body text-sm flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                🇮🇱 +972
              </div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                placeholder={he ? '05X-XXX-XXXX' : '05X-XXX-XXXX'}
                className="input-glass flex-1"
                autoFocus
              />
            </div>

            {error && <p className="text-xs text-red-400 mb-3 font-body">{error}</p>}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <>
                    {he ? 'שלח קוד אימות' : 'Send Verification Code'}
                    {isRTL ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}
                  </>
              }
            </button>
          </>
        ) : (
          <>
            <h2 className="font-heading font-bold text-xl mb-1">
              {he ? 'הזן את הקוד' : 'Enter the code'}
            </h2>
            <p className="text-secondary text-sm font-body mb-5">
              {he ? `נשלח ל-+972${phone}` : `Sent to +972${phone}`}
            </p>

            {/* OTP boxes — always LTR regardless of lang */}
            <div className="flex gap-2 justify-center mb-5 ltr" dir="ltr">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-display rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: d ? 'rgba(0,90,60,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${d ? 'rgba(0,90,60,0.6)' : 'rgba(255,255,255,0.09)'}`,
                    color: '#f0f4f2',
                    boxShadow: d ? '0 0 12px rgba(0,90,60,0.3)' : 'none',
                  }}
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-400 mb-3 font-body text-center">{error}</p>}

            <button
              onClick={handleOtpSubmit}
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : (he ? '⚽ כנס לאפליקציה' : '⚽ Enter the App')
              }
            </button>

            <button
              onClick={() => { setOtp(['','','','','','']); handlePhoneSubmit() }}
              className="w-full mt-3 text-center text-xs font-heading text-secondary"
            >
              {he ? 'שלח שוב' : 'Resend code'}
            </button>
          </>
        )}
      </div>

      <p className="relative z-10 text-center text-[10px] font-body text-muted mt-6 px-4">
        {he
          ? 'בכניסה אתה מאשר את תנאי השימוש ומדיניות הפרטיות שלנו'
          : 'By continuing you agree to our Terms of Service and Privacy Policy'}
      </p>
    </div>
  )
}
