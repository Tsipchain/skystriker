import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import type { City } from '../types'

export default function Cities() {
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
      <h1 className="section-title">Cities</h1>
      <p className="section-subtitle">
        {countryId ? 'Showing cities in selected country' : 'All destinations with verified local guides'}
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
            meta={`${c.guide_count} guides · ${c.experience_count} experiences`}
          />
        ))}
      </div>

      {cities.length === 0 && (
        <p className="text-gray-400 text-center py-12">No cities found.</p>
      )}
    </div>
  )
}
