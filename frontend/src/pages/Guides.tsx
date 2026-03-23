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

  useEffect(() => {
    api.get<GuideCard[]>('/api/v1/public/guides')
      .then(setGuides)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title">{t('guides')}</h1>
      <p className="section-subtitle">{t('guides_subtitle')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {guides.map((g) => (
          <Link key={g.id} to={`/guides/${g.id}`} className="card p-6 text-center hover:shadow-md transition-shadow group">
            <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-sky-100">
              {g.avatar_url ? (
                <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sky-400 text-2xl">&#9992;</div>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-sky-700">{g.full_name}</h3>
            <p className="text-sm text-gray-500">{g.city_name}{g.country_name ? `, ${g.country_name}` : ''}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={g.verification_status === 'verified' ? 'badge-verified' : g.verification_status === 'pending' ? 'badge-pending' : 'badge-unverified'}>
                {t(g.verification_status as 'verified' | 'pending' | 'unverified')}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{g.rating.toFixed(1)} {t('rating').toLowerCase()} · {g.total_reviews} {t('reviews').toLowerCase()}</p>
            {g.languages.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{g.languages.join(', ')}</p>
            )}
          </Link>
        ))}
      </div>

      {guides.length === 0 && (
        <p className="text-gray-400 text-center py-12">{t('no_guides')}</p>
      )}
    </div>
  )
}
