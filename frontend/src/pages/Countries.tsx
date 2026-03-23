import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import LoadingBlock from '../components/LoadingBlock'
import { useLang } from '../context/LanguageContext'
import type { Country } from '../types'

export default function Countries() {
  const { t } = useLang()
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Country[]>('/api/v1/public/countries')
      .then(setCountries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="section-title">{t('countries')}</h1>
      <p className="section-subtitle">{t('explore_by_country')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {countries.map((c) => (
          <Link
            key={c.id}
            to={`/cities?country=${c.id}`}
            className="card p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{c.flag_emoji || '🌍'}</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-sky-700 text-lg">{c.name}</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wide">{c.code}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {countries.length === 0 && (
        <p className="text-gray-400 text-center py-12">{t('no_countries')}</p>
      )}
    </div>
  )
}
