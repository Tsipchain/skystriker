import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import LoadingBlock from '../components/LoadingBlock'
import { useLang } from '../context/LanguageContext'
import type { GuideCard } from '../types'

export default function Guides() {
  const { t } = useLang()
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all')

  useEffect(() => {
    api.get<GuideCard[]>('/api/v1/public/guides')
      .then(setGuides)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? guides : guides.filter((g) => g.verification_status === filter)

  if (loading) return <LoadingBlock />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{t('guides')}</h1>
        <p className="text-gray-500 mt-2 text-lg max-w-2xl mx-auto">{t('guides_subtitle')}</p>
      </div>

      {/* Filter pills */}
      <div className="flex justify-center gap-2 mb-8">
        {(['all', 'verified', 'pending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? t('all') : t(f)}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((g) => (
          <Link
            key={g.id}
            to={`/guides/${g.id}`}
            className="card overflow-hidden hover:shadow-lg transition-all duration-300 group"
          >
            {/* Top gradient banner with avatar */}
            <div className="relative bg-gradient-to-br from-sky-500 to-sky-700 h-24">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-sky-100 shadow-md">
                  {g.avatar_url ? (
                    <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sky-400 text-2xl">&#9992;</div>
                  )}
                </div>
              </div>
              {/* Verification badge */}
              <div className="absolute top-3 right-3">
                {g.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {t('verified')}
                  </span>
                ) : g.verification_status === 'pending' ? (
                  <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {t('pending')}
                  </span>
                ) : (
                  <span className="bg-gray-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                    {t('unverified')}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pt-12 pb-5 px-5 text-center">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-sky-700 transition-colors">
                {g.full_name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {g.city_name}{g.country_name ? `, ${g.country_name}` : ''}
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(g.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{g.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({g.total_reviews})</span>
              </div>

              {/* Bio */}
              {g.bio && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{g.bio}</p>
              )}

              {/* Specialties */}
              {g.specialties.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {g.specialties.slice(0, 4).map((s) => (
                    <span key={s} className="bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Languages */}
              {g.languages.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  🗣 {g.languages.join(' · ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-12">{t('no_guides')}</p>
      )}
    </div>
  )
}
