import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import type { AuditEntry } from '../../types'

export default function AdminAudit() {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h2>

      {entries.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No audit entries yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actor</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Target</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Detail</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Time</th>
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
