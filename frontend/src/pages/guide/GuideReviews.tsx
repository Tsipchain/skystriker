import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import type { Review } from '../../types'

export default function GuideReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Review[]>('/api/v1/guide/reviews')
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reviews</h2>

      {reviews.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No reviews yet.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{r.reviewer_name}</span>
                <span className="text-amber-500 font-bold">{r.rating}/5</span>
              </div>
              {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
              {r.guide_response && (
                <div className="mt-3 pl-4 border-l-2 border-sky-200">
                  <p className="text-xs text-gray-400 mb-1">Your response</p>
                  <p className="text-gray-600 text-sm">{r.guide_response}</p>
                </div>
              )}
              {r.is_flagged && (
                <span className="badge bg-red-100 text-red-700 mt-2">Flagged</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
