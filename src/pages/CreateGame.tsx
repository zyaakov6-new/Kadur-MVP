import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Clock, ChevronDown } from 'lucide-react'
import type { GameFormat } from '../types'
import { useLang } from '../contexts/LanguageContext'

export default function CreateGame() {
  const navigate = useNavigate()
  const { t, isRTL } = useLang()

  const [form, setForm] = useState({
    title: '', description: '', format: '5v5' as GameFormat,
    location: '', date: '', time: '', city: 'Tel Aviv',
  })
  const [step, setStep] = useState(1)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleNext = () => step < 3 ? setStep(s => s + 1) : navigate('/')

  const formatOptions: GameFormat[] = ['5v5', '7v7', '11v11']
  const cityOptions = ['Tel Aviv', 'Jerusalem', 'Haifa', "Be'er Sheva", 'Ramat Gan']
  const playersLabel: Record<GameFormat, string> = {
    '5v5': t.create.players_10, '7v7': t.create.players_14, '11v11': t.create.players_22,
  }

  const BackIcon    = isRTL ? ArrowRight : ArrowLeft

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: 'calc(80px + var(--safe-bottom))' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-radial-green absolute inset-0" />
        <div className="pitch-lines absolute inset-0 opacity-30" />
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center gap-4 px-5 pt-14 pb-5">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="w-10 h-10 glass-card flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
        >
          <BackIcon size={18} />
        </button>
        <div>
          <h1 className="font-display text-2xl tracking-wider leading-tight">{t.create.title}</h1>
          <p className="text-xs font-heading text-secondary uppercase tracking-widest">
            {t.create.step_of} {step} {t.create.of} 3
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="relative z-10 px-5 mb-6">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%`, background: 'linear-gradient(90deg, #005A3C, #52b48d)' }}
          />
        </div>
      </div>

      <div className="relative z-10 px-5">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-4 space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2">
                  {t.create.game_title} *
                </label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={t.create.title_ph} className="input-glass" />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2">
                  {t.create.desc}
                </label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={t.create.desc_ph} rows={3} className="input-glass resize-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-3">
                {t.create.format} *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {formatOptions.map(f => (
                  <button
                    key={f}
                    onClick={() => set('format', f)}
                    className="glass-card py-4 flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-95"
                    style={{
                      borderColor: form.format === f ? 'rgba(0,90,60,0.5)' : 'rgba(255,255,255,0.09)',
                      background: form.format === f ? 'rgba(0,90,60,0.2)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="font-display text-2xl" style={{ color: form.format === f ? '#52b48d' : 'rgba(240,244,242,0.5)' }}>{f}</span>
                    <span className="text-[10px] font-heading uppercase tracking-wider text-muted">{playersLabel[f]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-4 space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <MapPin size={11} className="text-pitch-400" /> {t.create.location} *
                </label>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder={t.create.location_ph} className="input-glass" />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2">{t.create.city}</label>
                <div className="relative">
                  <select value={form.city} onChange={e => set('city', e.target.value)} className="input-glass appearance-none cursor-pointer" style={{ paddingInlineEnd: '40px', background: 'rgba(255,255,255,0.05)' }}>
                    {cityOptions.map(c => <option key={c} value={c} style={{ background: '#0f1510' }}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none" style={{ insetInlineEnd: '16px' }} />
                </div>
              </div>
            </div>
            <div className="glass-card p-4 space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <Clock size={11} className="text-ember-400" /> {t.create.date} *
                </label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-glass" style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-xs font-heading font-bold uppercase tracking-widest text-muted mb-2">{t.create.time} *</label>
                <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="input-glass" style={{ colorScheme: 'dark' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-5 space-y-4">
              <h2 className="font-heading font-bold uppercase tracking-wider text-sm text-secondary">{t.create.review}</h2>
              <div className="space-y-3">
                {[
                  { label: t.create.title_label,  value: form.title    || '—' },
                  { label: t.create.format_label,  value: form.format              },
                  { label: t.create.location,      value: form.location || '—', sub: form.city },
                  { label: t.create.when_label,    value: form.date ? `${form.date} ${t.create.at} ${form.time}` : '—' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-heading font-semibold uppercase tracking-wider text-muted">{label}</span>
                    <div className="text-end">
                      <span className="text-sm font-heading font-bold">{value}</span>
                      {sub && <p className="text-xs text-secondary">{sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 mt-8">
        <button
          onClick={handleNext}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
          style={{ opacity: step === 1 && !form.title ? 0.5 : 1 }}
          disabled={step === 1 && !form.title}
        >
          {step < 3 ? t.create.continue : t.create.publish}
        </button>
      </div>
    </div>
  )
}
