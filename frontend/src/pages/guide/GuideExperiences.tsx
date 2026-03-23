import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { ExperienceCard } from '../../types'

export default function GuideExperiences() {
  const { t } = useLang()
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ExperienceCard[]>('/api/v1/guide/experiences')
      .then(setExperiences)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm(t('delete_experience_confirm'))) return
    try {
      await api.delete(`/api/v1/guide/experiences/${id}`)
      setExperiences((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('my_experiences')}</h2>
      </div>

      {experiences.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>{t('no_experiences_yet')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((e) => (
            <div key={e.id} className="card p-5 flex items-start justify-between gap-4">
              <div className="flex gap-4">
                {e.photo_url && (
                  <img src={e.photo_url} alt={e.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{e.title}</h3>
                  <p className="text-sm text-gray-500">
                    {e.city_name} · {e.duration_minutes} {t('min')} · {e.currency} {e.price}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {e.avg_rating.toFixed(1)} {t('rating')} · {e.total_bookings} {t('bookings')}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                {t('delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
