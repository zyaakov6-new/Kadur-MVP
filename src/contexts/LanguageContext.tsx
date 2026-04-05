import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import he from '../i18n/he'
import en from '../i18n/en'
import type { Translations } from '../i18n/he'

type Lang = 'he' | 'en'

interface LanguageContextValue {
  lang:      Lang
  t:         Translations
  toggleLang: () => void
  isRTL:     boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'kadur-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'he'
  })

  const isRTL = lang === 'he'
  const t     = lang === 'he' ? he : en

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRTL])

  const toggleLang = () => setLang(l => l === 'he' ? 'en' : 'he')

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
