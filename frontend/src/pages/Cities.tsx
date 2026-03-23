import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import { useLang } from '../context/LanguageContext'
import type { City } from '../types'

export default function Cities() {
  const { t } = useLang()
  const [searchParams] = useSearchParams()
  const countryId = searchParams.get('country') || ''
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = countryId
      ? `/api/v1/public/cities?country_id=${countryId}`
      : '/api/v1/public/cities'
    api.get<City[]>(url)
      .then(setCities)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [countryId])

  if (loading) return <LoadingBlock />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title">{t('cities')}</h1>
      <p className="section-subtitle">
        {countryId ? t('cities_in_country') : t('all_destinations_desc')}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((c) => (
          <DiscoveryCard
            key={c.id}
            to={`/cities/${c.slug}`}
            imageUrl={c.photo_url}
            title={c.name}
            subtitle={c.tagline}
            badge={c.country_name}
            meta={`${c.guide_count} ${t('guides').toLowerCase()} · ${c.experience_count} ${t('experiences').toLowerCase()}`}
          />
        ))}
      </div>

      {cities.length === 0 && (
        <p className="text-gray-400 text-center py-12">{t('no_cities')}</p>
      )}
    </div>
  )
}
