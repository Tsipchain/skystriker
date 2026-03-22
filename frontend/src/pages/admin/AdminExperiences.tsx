import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import type { ExperienceCard } from '../../types'

export default function AdminExperiences() {
  const [experiences, setExperiences] = useState<ExperienceCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<ExperienceCard[]>('/api/v1/admin/experiences')
      .then(setExperiences)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this experience?')) return
    try {
      await api.delete(`/api/v1/admin/experiences/${id}`)
      setExperiences((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Experiences</h2>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Title</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Guide</th>
              <th className="px-4 py-3 font-semibold text-gray-600">City</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Rating</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {experiences.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                <td className="px-4 py-3 text-gray-500">{e.guide_name}</td>
                <td className="px-4 py-3 text-gray-500">{e.city_name}</td>
                <td className="px-4 py-3 text-gray-600">{e.currency} {e.price}</td>
                <td className="px-4 py-3 text-gray-600">{e.avg_rating.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {experiences.length === 0 && (
        <p className="text-gray-400 text-center py-12">No experiences found.</p>
      )}
    </div>
  )
}
