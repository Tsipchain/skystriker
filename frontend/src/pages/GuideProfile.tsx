import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import type { GuideDetail } from '../types'

export default function GuideProfile() {
  const { guideId } = useParams<{ guideId: string }>()
  const [guide, setGuide] = useState<GuideDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!guideId) return
    api.get<GuideDetail>(`/api/v1/public/guides/${guideId}`)
      .then(setGuide)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [guideId])

  if (loading) return <LoadingBlock />
  if (!guide) return <p className="text-center py-20 text-gray-400">Guide not found.</p>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profile header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-sky-100 flex-shrink-0">
            {guide.avatar_url ? (
              <img src={guide.avatar_url} alt={guide.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sky-400 text-3xl">&#9992;</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{guide.full_name}</h1>
            <p className="text-gray-500">{guide.city_name}{guide.country_name ? `, ${guide.country_name}` : ''}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={guide.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'}>
                {guide.verification_status}
              </span>
              <span className="text-sm text-gray-500">{guide.rating.toFixed(1)} rating · {guide.total_reviews} reviews</span>
            </div>
            {guide.bio && <p className="text-gray-600 mt-4">{guide.bio}</p>}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {guide.languages.length > 0 && (
                <div><span className="font-semibold text-gray-700">Languages:</span> {guide.languages.join(', ')}</div>
              )}
              {guide.specialties.length > 0 && (
                <div><span className="font-semibold text-gray-700">Specialties:</span> {guide.specialties.join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Experiences */}
      {guide.experiences && guide.experiences.length > 0 && (
        <section>
          <h2 className="section-title">Experiences by {guide.full_name}</h2>
          <p className="section-subtitle">{guide.experiences.length} experiences available</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {guide.experiences.map((e) => (
              <DiscoveryCard
                key={e.id}
                to={`/experiences/${e.slug}`}
                imageUrl={e.photo_url}
                title={e.title}
                subtitle={e.description}
                badge={`${e.currency} ${e.price}`}
                badgeColor="bg-emerald-600"
                meta={`${e.duration_minutes} min · ${e.avg_rating.toFixed(1)} stars`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
