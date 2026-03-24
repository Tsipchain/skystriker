import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { GuideDetail } from '../../types'

interface VerifyIDStatus {
  verifyid_configured: boolean
  agent_available: boolean
  online_agents: number
}

interface ActionResult {
  guide_id: string
  status: string
  blockchain_hash?: string
  blockchain_submitted?: boolean
  verifyid_synced?: boolean
}

export default function AdminVerifications() {
  const { t } = useLang()
  const [guides, setGuides] = useState<GuideDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [verifyidStatus, setVerifyidStatus] = useState<VerifyIDStatus | null>(null)
  const [actionResults, setActionResults] = useState<Record<string, ActionResult>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<GuideDetail[]>('/api/v1/admin/guides?status=pending'),
      api.get<VerifyIDStatus>('/api/v1/admin/verifyid/status').catch(() => null),
    ])
      .then(([g, vs]) => {
        setGuides(g)
        if (vs) setVerifyidStatus(vs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: 'verify' | 'reject' | 'suspend') {
    setProcessing(id)
    try {
      const result = await api.post<ActionResult>(`/api/v1/admin/guides/${id}/${action}`, {})
      setActionResults((prev) => ({ ...prev, [id]: result }))
      // Remove from pending list after brief delay to show result
      setTimeout(() => {
        setGuides((prev) => prev.filter((g) => g.id !== id))
        setActionResults((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 3000)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setProcessing(null)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('pending_verifications')}</h2>

        {/* VerifyID platform status badge */}
        {verifyidStatus && (
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
              verifyidStatus.verifyid_configured
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${verifyidStatus.verifyid_configured ? 'bg-green-500' : 'bg-gray-400'}`} />
              VerifyID {verifyidStatus.verifyid_configured ? 'Connected' : 'Offline'}
            </span>
            {verifyidStatus.agent_available ? (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-sky-100 text-sky-700">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                {verifyidStatus.online_agents} Agent{verifyidStatus.online_agents !== 1 ? 's' : ''} Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-amber-100 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                No Agents — Video Call Fallback
              </span>
            )}
          </div>
        )}
      </div>

      {guides.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {t('no_pending_verifications')}
        </div>
      ) : (
        <div className="space-y-4">
          {guides.map((g) => {
            const result = actionResults[g.id]
            const isProcessing = processing === g.id

            return (
              <div key={g.id} className="card overflow-hidden">
                {/* Action result banner */}
                {result && (
                  <div className={`px-5 py-3 text-sm font-medium ${
                    result.status === 'verified'
                      ? 'bg-green-50 text-green-800 border-b border-green-100'
                      : 'bg-red-50 text-red-800 border-b border-red-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>
                        {result.status === 'verified' ? 'Approved' : 'Rejected'}
                        {result.verifyid_synced && ' — Synced to VerifyID'}
                      </span>
                      <div className="flex items-center gap-3">
                        {result.blockchain_hash && (
                          <span className="font-mono text-xs opacity-70">
                            Blockchain: {result.blockchain_hash.slice(0, 12)}…
                            {result.blockchain_submitted ? ' (confirmed)' : ' (local)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                    {/* VerifyID reference badge */}
                    {g.verifyid_reference && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                        VerifyID #{g.verifyid_reference}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(g.id, 'verify')}
                      disabled={isProcessing}
                      className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
                    >
                      {isProcessing ? '…' : t('approve')}
                    </button>
                    <button
                      onClick={() => handleAction(g.id, 'reject')}
                      disabled={isProcessing}
                      className="btn-secondary py-1.5 px-4 text-sm disabled:opacity-50"
                    >
                      {isProcessing ? '…' : t('reject')}
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

                    {/* VerifyID reference and video call fallback */}
                    <div className="mt-3 flex items-center justify-between">
                      {g.verifyid_reference && (
                        <p className="text-xs text-gray-400">
                          VerifyID Ref: <span className="font-mono">{g.verifyid_reference}</span>
                        </p>
                      )}
                      {/* Video call fallback when no agent available */}
                      {verifyidStatus && !verifyidStatus.agent_available && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          WebRTC video identity verification available as fallback
                        </span>
                      )}
                    </div>

                    {/* Blockchain security note */}
                    <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-indigo-700">
                        Thronos Blockchain Security
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        Verification decisions are sealed with SHA-256 hash and submitted to the Thronos blockchain network.
                        This provides quantum-resistant immutable audit trail for all identity verification events.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
