import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import type { City, ExperienceCard, GuideCard, PlatformStats } from '../types'

export default function Home() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<PlatformStats>('/api/v1/public/stats'),
      api.get<City[]>('/api/v1/public/cities'),
      api.get<GuideCard[]>('/api/v1/public/guides'),
      api.get<ExperienceCard[]>('/api/v1/public/experiences'),
    ])
      .then(([s, c, g, e]) => {
        setStats(s)
        setCities(c.slice(0, 6))
        setGuides(g.slice(0, 4))
        setExperiences(e.slice(0, 6))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock text="Loading SkyStriker..." />

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-sky-600 to-sky-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Discover the world through<br />
            <span className="text-amber-300">verified local guides</span>
          </h1>
          <p className="text-sky-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Authentic destination experiences from locals who know their cities best.
            Every guide on SkyStriker is identity-verified through Thronos Chain.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/experiences" className="bg-white text-sky-700 font-bold px-6 py-3 rounded-lg hover:bg-sky-50 transition-colors shadow-lg">
              Browse Experiences
            </Link>
            <Link to="/verification" className="border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              How Verification Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { label: 'Countries', value: stats.countries },
              { label: 'Cities', value: stats.cities },
              { label: 'Guides', value: stats.guides },
              { label: 'Experiences', value: stats.experiences },
              { label: 'Verified Guides', value: stats.verified_guides },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-sky-700">{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Popular Cities</h2>
            <p className="section-subtitle">Explore destinations with verified local guides</p>
          </div>
          <Link to="/cities" className="btn-ghost text-sm">View all cities &rarr;</Link>
        </div>
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
      </section>

      {/* Experiences */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Experiences</h2>
              <p className="section-subtitle">Handpicked activities from top-rated guides</p>
            </div>
            <Link to="/experiences" className="btn-ghost text-sm">View all &rarr;</Link>
          </div>
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
                meta={`${e.city_name} · ${e.duration_minutes} min · ${e.avg_rating.toFixed(1)} stars`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Top Guides</h2>
            <p className="section-subtitle">Meet verified locals ready to show you their city</p>
          </div>
          <Link to="/guides" className="btn-ghost text-sm">View all guides &rarr;</Link>
        </div>
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
                <span className={g.verification_status === 'verified' ? 'badge-verified' : 'badge-pending'}>
                  {g.verification_status}
                </span>
                <span className="text-xs text-gray-400">{g.rating.toFixed(1)} ({g.total_reviews})</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
