import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import { useLang } from '../context/LanguageContext'
import type { CityDetail as CityDetailType } from '../types'

export default function CityDetail() {
  const { t } = useLang()
  const { slug } = useParams<{ slug: string }>()
  const [city, setCity] = useState<CityDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    api.get<CityDetailType>(`/api/v1/public/cities/${slug}`)
      .then(setCity)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <LoadingBlock />
  if (!city) return <p className="text-center py-20 text-gray-400">{t('city_not_found')}</p>

  return (
    <div>
      {/* Hero */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        {city.photo_url ? (
          <img src={city.photo_url} alt={city.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white max-w-7xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">{city.country_name}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold">{city.name}</h1>
          {city.tagline && <p className="text-lg text-gray-200 mt-1">{city.tagline}</p>}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {city.description && <p className="text-gray-600 max-w-3xl mb-12">{city.description}</p>}

        {/* Guides */}
        {city.guides.length > 0 && (
          <section className="mb-12">
            <h2 className="section-title">{t('guides_in_city', { name: city.name })}</h2>
            <p className="section-subtitle">{t('verified_local_guides_count', { count: city.guides.length })}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {city.guides.map((g) => (
                <Link key={g.id} to={`/guides/${g.id}`} className="card p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden bg-sky-100">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt={g.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400">&#9992;</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{g.full_name}</h3>
                  <span className={g.verification_status === 'verified' ? 'badge-verified mt-1' : 'badge-pending mt-1'}>
                    {g.verification_status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{g.rating.toFixed(1)} ({g.total_reviews} {t('reviews')})</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Experiences */}
        {city.experiences.length > 0 && (
          <section>
            <h2 className="section-title">{t('experiences_in_city', { name: city.name })}</h2>
            <p className="section-subtitle">{t('activities_to_choose', { count: city.experiences.length })}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {city.experiences.map((e) => (
                <DiscoveryCard
                  key={e.id}
                  to={`/experiences/${e.slug}`}
                  imageUrl={e.photo_url}
                  title={e.title}
                  subtitle={e.description}
                  badge={`${e.currency} ${e.price}`}
                  badgeColor="bg-emerald-600"
                  meta={`${e.duration_minutes} ${t('min')} · ${e.avg_rating.toFixed(1)} ${t('stars')} · ${t('by')} ${e.guide_name}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
