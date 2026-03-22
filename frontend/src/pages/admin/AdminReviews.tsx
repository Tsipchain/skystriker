import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import type { Review } from '../../types'

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Review[]>('/api/v1/admin/reviews')
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleFlag(id: string) {
    try {
      await api.post(`/api/v1/admin/reviews/${id}/flag`)
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_flagged: true, is_published: false } : r))
      )
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Reviews</h2>

      {reviews.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No reviews found.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-gray-900">{r.reviewer_name}</span>
                  <span className="text-amber-500 font-bold text-sm">{r.rating}/5</span>
                  {r.is_flagged && <span className="badge bg-red-100 text-red-700">Flagged</span>}
                </div>
                {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                {r.guide_response && (
                  <p className="text-gray-400 text-xs mt-1 italic">Guide replied: {r.guide_response}</p>
                )}
              </div>
              {!r.is_flagged && (
                <button onClick={() => handleFlag(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium whitespace-nowrap">
                  Flag
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
