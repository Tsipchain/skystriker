import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { AuditEntry } from '../../types'

export default function AdminAudit() {
  const { t } = useLang()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AuditEntry[]>('/api/v1/admin/audit')
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('audit_log')}</h2>

      {entries.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">{t('no_audit_entries')}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('action')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('actor')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('target')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('detail')}</th>
                <th className="px-4 py-3 font-semibold text-gray-600">{t('time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="badge bg-sky-100 text-sky-800">{e.action.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.actor}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {e.target_type && `${e.target_type}/${e.target_id?.slice(0, 8)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{e.detail}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {e.created_at ? new Date(e.created_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
