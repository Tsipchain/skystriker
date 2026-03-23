import en from './translations/en'
import el from './translations/el'
import it from './translations/it'
import es from './translations/es'
import tr from './translations/tr'
import pt from './translations/pt'
import fr from './translations/fr'
import de from './translations/de'

export type TranslationKey = keyof typeof en
export type Lang = 'en' | 'el' | 'it' | 'es' | 'tr' | 'pt' | 'fr' | 'de'

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

const translations: Record<Lang, Record<string, string>> = {
  en, el, it, es, tr, pt, fr, de,
}

export function getTranslation(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] || translations.en[key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

export default translations
