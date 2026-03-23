import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getTranslation, type Lang, type TranslationKey } from '../i18n'

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}

function detectLang(): Lang {
  const stored = localStorage.getItem('skystriker_lang')
  if (stored) return stored as Lang

  const browser = navigator.language?.slice(0, 2)?.toLowerCase()
  const supported: Lang[] = ['en', 'el', 'it', 'es', 'tr', 'pt', 'fr', 'de']
  if (supported.includes(browser as Lang)) return browser as Lang

  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('skystriker_lang', l)
    setLangState(l)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      getTranslation(lang, key, params),
    [lang],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
