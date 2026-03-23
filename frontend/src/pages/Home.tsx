import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import DiscoveryCard from '../components/DiscoveryCard'
import LoadingBlock from '../components/LoadingBlock'
import { useLang } from '../context/LanguageContext'
import type { City, ExperienceCard, GuideCard, PlatformStats } from '../types'

export default function Home() {
  const { t } = useLang()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)
  const [shareMsg, setShareMsg] = useState('')

  function handleShare() {
    const url = window.location.origin
    const text = 'Discover verified local guides & authentic destination experiences on SkyStriker!'
    if (navigator.share) {
      navigator.share({ title: 'SkyStriker Global Guides', text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setShareMsg(t('link_copied'))
        setTimeout(() => setShareMsg(''), 3000)
      }).catch(() => {})
    }
  }

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

  if (loading) return <LoadingBlock text={t('loading_skystriker')} />

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-sky-600 to-sky-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {t('hero_title_line1')}<br />
            <span className="text-amber-300">{t('hero_title_highlight')}</span>
          </h1>
          <p className="text-sky-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            {t('hero_desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/experiences" className="bg-white text-sky-700 font-bold px-6 py-3 rounded-lg hover:bg-sky-50 transition-colors shadow-lg">
              {t('browse_experiences')}
            </Link>
            <Link to="/verification" className="border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              {t('how_verification_works')}
            </Link>
            <button
              onClick={handleShare}
              className="border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {t('share')}
            </button>
          </div>
          {shareMsg && (
            <p className="text-sm text-amber-300 mt-3 animate-pulse">{shareMsg}</p>
          )}
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {[
              { label: t('countries'), value: stats.countries },
              { label: t('cities'), value: stats.cities },
              { label: t('guides'), value: stats.guides },
              { label: t('experiences'), value: stats.experiences },
              { label: t('verified_guides'), value: stats.verified_guides },
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
            <h2 className="section-title">{t('popular_cities')}</h2>
            <p className="section-subtitle">{t('explore_destinations_desc')}</p>
          </div>
          <Link to="/cities" className="btn-ghost text-sm">{t('view_all_cities')} &rarr;</Link>
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
              meta={`${c.guide_count} ${t('guides').toLowerCase()} · ${c.experience_count} ${t('experiences').toLowerCase()}`}
            />
          ))}
        </div>
      </section>

      {/* Experiences */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">{t('featured_experiences')}</h2>
              <p className="section-subtitle">{t('handpicked_desc')}</p>
            </div>
            <Link to="/experiences" className="btn-ghost text-sm">{t('view_all')} &rarr;</Link>
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
                meta={`${e.city_name} · ${e.duration_minutes} ${t('min')} · ${e.avg_rating.toFixed(1)} ${t('stars')}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">{t('top_guides')}</h2>
            <p className="section-subtitle">{t('meet_guides_desc')}</p>
          </div>
          <Link to="/guides" className="btn-ghost text-sm">{t('view_all_guides')} &rarr;</Link>
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
                  {t(g.verification_status as 'verified' | 'pending' | 'unverified')}
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
