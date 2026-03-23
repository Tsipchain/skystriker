import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { GuideCard } from '../../types'

export default function AdminVerifications() {
  const { t } = useLang()
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<GuideCard[]>('/api/v1/admin/guides?status=pending')
      .then(setGuides)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: 'verify' | 'reject' | 'suspend') {
    try {
      await api.post(`/api/v1/admin/guides/${id}/${action}`)
      setGuides((prev) => prev.filter((g) => g.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('pending_verifications')}</h2>

      {guides.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {t('no_pending_verifications')}
        </div>
      ) : (
        <div className="space-y-4">
          {guides.map((g) => (
            <div key={g.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-100 overflow-hidden flex-shrink-0">
                  {g.avatar_url ? (
                    <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{g.full_name}</h3>
                  <p className="text-sm text-gray-500">{g.city_name}{g.country_name ? `, ${g.country_name}` : ''}</p>
                  <p className="text-xs text-gray-400">{g.languages.join(', ')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAction(g.id, 'verify')} className="btn-primary py-1.5 px-4 text-sm">
                  {t('approve')}
                </button>
                <button onClick={() => handleAction(g.id, 'reject')} className="btn-secondary py-1.5 px-4 text-sm">
                  {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
