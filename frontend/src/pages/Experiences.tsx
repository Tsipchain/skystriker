import { useEffect, useState } from 'react'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import type { ExperienceCard } from '../types'

export default function Experiences() {
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ExperienceCard[]>('/api/v1/public/experiences')
      .then(setExperiences)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title">Experiences</h1>
      <p className="section-subtitle">Authentic destination activities from verified local guides</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((e) => (
          <DiscoveryCard
            key={e.id}
            to={`/experiences/${e.slug}`}
            imageUrl={e.photo_url}
            title={e.title}
            subtitle={e.description}
            badge={`${e.currency} ${e.price}`}
            badgeColor="bg-emerald-600"
            meta={`${e.city_name} · ${e.duration_minutes} min · ${e.avg_rating.toFixed(1)} stars · by ${e.guide_name}`}
          />
        ))}
      </div>

      {experiences.length === 0 && (
        <p className="text-gray-400 text-center py-12">No experiences found.</p>
      )}
    </div>
  )
}
