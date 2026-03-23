import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { GuideCard } from '../../types'

export default function AdminGuides() {
  const { t } = useLang()
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<GuideCard[]>('/api/v1/admin/guides')
      .then(setGuides)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('all_guides')}</h2>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('name')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('city')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('status')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('rating')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('reviews')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {guides.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 overflow-hidden flex-shrink-0">
                      {g.avatar_url ? (
                        <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <span className="font-medium text-gray-900">{g.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{g.city_name}</td>
                <td className="px-4 py-3">
                  <span className={
                    g.verification_status === 'verified' ? 'badge-verified' :
                    g.verification_status === 'pending' ? 'badge-pending' :
                    'badge-unverified'
                  }>
                    {g.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{g.rating.toFixed(1)}</td>
                <td className="px-4 py-3 text-gray-600">{g.total_reviews}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guides.length === 0 && (
        <p className="text-gray-400 text-center py-12">{t('no_guides')}</p>
      )}
    </div>
  )
}
