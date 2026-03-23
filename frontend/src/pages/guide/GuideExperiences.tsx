import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { ExperienceCard, GuideDetail, City } from '../../types'

const CATEGORIES = [
  'walking_tour', 'food_and_drink', 'history_and_culture', 'adventure',
  'nature', 'nightlife', 'workshop', 'photography', 'wellness', 'custom',
]

export default function GuideExperiences() {
  const { t } = useLang()
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)
  const [guide, setGuide] = useState<GuideDetail | null>(null)
  const [cities, setCities] = useState<City[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('walking_tour')
  const [durationMin, setDurationMin] = useState(120)
  const [price, setPrice] = useState(0)
  const [currency, setCurrency] = useState('EUR')
  const [maxGuests, setMaxGuests] = useState(10)
  const [expLangs, setExpLangs] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [cityId, setCityId] = useState('')
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<ExperienceCard[]>('/api/v1/guide/experiences'),
      api.get<GuideDetail>('/api/v1/guide/me'),
      api.get<City[]>('/api/v1/public/cities'),
    ])
      .then(([exps, g, c]) => {
        setExperiences(exps)
        setGuide(g)
        setCities(c)
      })
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const exp = await api.post<ExperienceCard>('/api/v1/guide/experiences', {
        title,
        description,
        category,
        duration_minutes: durationMin,
        price,
        currency,
        max_guests: maxGuests,
        languages: expLangs,
        photo_url: photoUrl,
        city_id: cityId,
      })
      setExperiences((prev) => [exp, ...prev])
      setShowCreate(false)
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setCreateError(err?.message || t('failed_save'))
    } finally {
      setCreating(false)
    }
  }

  async function handlePhotoUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/v1/guide/upload', {
        method: 'POST',
        headers: {
          'X-Guide-Id': guide?.id || '',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: formData,
      })
      const data = await res.json()
      if (data.url) setPhotoUrl(data.url)
    } catch {}
  }

  if (loading) return <LoadingBlock />

  const isVerified = guide?.verification_status === 'verified'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('my_experiences')}</h2>
        {isVerified && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            {showCreate ? t('cancel') : t('create_experience')}
          </button>
        )}
      </div>

      {/* Not verified banner */}
      {!isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800">{t('verification_required_title')}</p>
              <p className="text-sm text-yellow-700 mt-1">{t('verification_required_desc')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Experience Form */}
      {showCreate && isVerified && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{t('create_new_experience')}</h3>

          {createError && <p className="text-red-600 text-sm">{createError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('title_label')}</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('description')}</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('category')}</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('city')}</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">{t('select_city')}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('duration')} ({t('min')})</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={durationMin}
                onChange={(e) => setDurationMin(+e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('price')}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="flex-1 border rounded px-3 py-2"
                  value={price}
                  onChange={(e) => setPrice(+e.target.value)}
                  step="0.01"
                />
                <select
                  className="border rounded px-2 py-2 w-20"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option>EUR</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('max_guests')}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={maxGuests}
                onChange={(e) => setMaxGuests(+e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('languages_comma')}</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={expLangs}
                onChange={(e) => setExpLangs(e.target.value)}
                placeholder="English, Greek"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('experience_photo')}</label>
              {photoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={photoUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    {t('remove')}
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handlePhotoUpload(f)
                  }}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="bg-sky-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {creating ? t('saving') : t('create_experience')}
          </button>
        </form>
      )}

      {experiences.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>{t('no_experiences_yet')}</p>
          {isVerified && (
            <p className="text-sm mt-2">{t('create_first_experience')}</p>
          )}
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
