import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { GuideDetail } from '../../types'

export default function AdminVerifications() {
  const { t } = useLang()
  const [guides, setGuides] = useState<GuideDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.get<GuideDetail[]>('/api/v1/admin/guides?status=pending')
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
            <div key={g.id} className="card overflow-hidden">
              <div className="p-5 flex items-center justify-between">
                <div
                  className="flex items-center gap-4 cursor-pointer flex-1"
                  onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                >
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
                  {/* Fraud score badge */}
                  {g.fraud_score !== null && g.fraud_score !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      g.fraud_score < 30 ? 'bg-green-100 text-green-700' :
                      g.fraud_score < 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t('fraud_score')}: {g.fraud_score}
                    </span>
                  )}
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

              {/* Expanded document review */}
              {expandedId === g.id && (
                <div className="border-t bg-gray-50 p-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('submitted_documents')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* ID Document */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('upload_id_document')}</p>
                      {g.id_document_url ? (
                        <a href={g.id_document_url} target="_blank" rel="noopener noreferrer">
                          <img src={g.id_document_url} alt="ID" className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                          {t('no_document')}
                        </div>
                      )}
                    </div>

                    {/* Selfie */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('upload_selfie')}</p>
                      {g.selfie_url ? (
                        <a href={g.selfie_url} target="_blank" rel="noopener noreferrer">
                          <img src={g.selfie_url} alt="Selfie" className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                          {t('no_document')}
                        </div>
                      )}
                    </div>

                    {/* License */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{t('upload_guide_license')}</p>
                      {g.guide_license_url ? (
                        <a href={g.guide_license_url} target="_blank" rel="noopener noreferrer">
                          <img src={g.guide_license_url} alt="License" className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          {t('not_provided')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VerifyID / Fraud notes */}
                  {g.fraud_notes && (
                    <div className="mt-3 bg-white border rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">VerifyID Notes</p>
                      <p className="text-sm text-gray-700">{g.fraud_notes}</p>
                    </div>
                  )}
                  {g.verifyid_reference && (
                    <p className="text-xs text-gray-400 mt-2">
                      VerifyID Ref: <span className="font-mono">{g.verifyid_reference}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
