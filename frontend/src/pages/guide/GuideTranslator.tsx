import { useState, useEffect, useRef } from 'react'
import api from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { LANGUAGES } from '../../i18n'

interface TranslateResponse {
  original: string
  translated: string
  from_lang: string
  to_lang: string
  from_lang_name: string
  to_lang_name: string
}

interface SubscriptionInfo {
  id: string
  plan: string
  status: string
  price: number
  currency: string
  started_at: string
  expires_at: string
}

interface HistoryItem {
  original: string
  translated: string
  from_lang: string
  to_lang: string
  timestamp: number
}

export default function GuideTranslator() {
  const { t } = useLang()
  const [sub, setSub] = useState<SubscriptionInfo | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [text, setText] = useState('')
  const [fromLang, setFromLang] = useState('en')
  const [toLang, setToLang] = useState('el')
  const [result, setResult] = useState<TranslateResponse | null>(null)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<unknown>(null)

  useEffect(() => {
    api.get<SubscriptionInfo | null>('/api/v1/translator/subscription')
      .then(setSub)
      .catch(() => setSub(null))
      .finally(() => setSubLoading(false))
  }, [])

  async function handleSubscribe() {
    setError('')
    try {
      const result = await api.post<SubscriptionInfo>('/api/v1/translator/subscribe', {
        plan: 'translator_monthly',
      })
      setSub(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Subscription failed')
    }
  }

  async function handleTranslate() {
    if (!text.trim()) return
    setTranslating(true)
    setError('')
    try {
      const res = await api.post<TranslateResponse>('/api/v1/translator/translate', {
        text: text.trim(),
        from_lang: fromLang,
        to_lang: toLang,
      })
      setResult(res)
      setHistory((prev) => [
        { original: res.original, translated: res.translated, from_lang: fromLang, to_lang: toLang, timestamp: Date.now() },
        ...prev.slice(0, 19),
      ])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  function swapLanguages() {
    setFromLang(toLang)
    setToLang(fromLang)
    if (result) {
      setText(result.translated)
      setResult(null)
    }
  }

  function startListening() {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition not supported in this browser')
      return
    }
    const recognition = new (SR as new () => SpeechRecognition)()
    recognition.lang = fromLang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript || ''
      setText(transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
    recognitionRef.current = recognition
  }

  function speakTranslation() {
    if (!result) return
    const utterance = new SpeechSynthesisUtterance(result.translated)
    utterance.lang = toLang
    speechSynthesis.speak(utterance)
  }

  const langOptions = LANGUAGES.map((l) => ({ code: l.code, label: `${l.flag} ${l.label}` }))

  if (subLoading) {
    return (
      <div className="py-20 text-center text-gray-400">{t('loading')}</div>
    )
  }

  // Subscription paywall
  if (!sub) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('translator_title')}</h2>
        <p className="text-gray-500 mb-8">{t('translator_desc')}</p>

        <div className="max-w-lg mx-auto">
          <div className="card p-8 text-center border-2 border-sky-200">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#127760;</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('premium_feature')}</h3>
            <p className="text-gray-500 mb-4">{t('subscribe_unlock')}</p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-3xl font-bold text-sky-600 mb-1">{t('subscription_price')}</p>
              <p className="text-sm text-gray-500">{t('subscription_includes')}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">{t('free_trial')}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {LANGUAGES.map((l) => (
                <div key={l.code} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                  <span className="text-xl">{l.flag}</span>
                  <p className="text-xs text-gray-500 mt-1">{l.label}</p>
                </div>
              ))}
            </div>

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <button
              onClick={handleSubscribe}
              className="w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 transition-colors text-lg"
            >
              {t('subscribe_now')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('translator_title')}</h2>
          <p className="text-gray-500 text-sm">{t('translator_desc')}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
            &#10003; {t('active_subscription')}
          </span>
          <p className="text-xs text-gray-400 mt-1">
            {t('valid_until', { date: new Date(sub.expires_at).toLocaleDateString() })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Translator main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Language selectors */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {langOptions.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              <button
                onClick={swapLanguages}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 text-lg"
                title="Swap languages"
              >
                &#8644;
              </button>

              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {langOptions.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Input */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase">{t('from_lang')}: {LANGUAGES.find((l) => l.code === fromLang)?.label}</span>
              <div className="flex-1" />
              <button
                onClick={startListening}
                disabled={listening}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  listening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {listening ? (
                  <>{t('listening')}</>
                ) : (
                  <><span>&#127908;</span> {t('speak')}</>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('type_message')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleTranslate()
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleTranslate}
                disabled={translating || !text.trim()}
                className="bg-sky-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                {translating ? '...' : t('translate')}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="card p-4 bg-sky-50 border-sky-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-sky-600 uppercase">
                  {t('to_lang')}: {LANGUAGES.find((l) => l.code === toLang)?.label}
                </span>
                <button
                  onClick={speakTranslation}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 border border-gray-200"
                >
                  <span>&#128264;</span> {t('speak')}
                </button>
              </div>
              <p className="text-lg text-gray-900 font-medium">{result.translated}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No translations yet.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {history.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <span>{LANGUAGES.find((l) => l.code === item.from_lang)?.flag}</span>
                    <span>&#8594;</span>
                    <span>{LANGUAGES.find((l) => l.code === item.to_lang)?.flag}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{item.original}</p>
                  <p className="text-gray-900 font-medium">{item.translated}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// TypeScript declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
