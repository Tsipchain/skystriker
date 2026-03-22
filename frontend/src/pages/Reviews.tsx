import { useState, useEffect } from 'react'
import api from '../api/client'
import ReviewCard from '../components/ReviewCard'
import type { Review } from '../types'

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [pendingOnly, setPendingOnly] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    api.get('/api/v1/reviews', { params: { pending_only: pendingOnly } })
      .then((res) => setReviews(res.data))
      .catch(console.error)
  }, [pendingOnly])

  const submitResponse = async () => {
    if (!respondingTo || !responseText.trim()) return
    await api.post(`/api/v1/reviews/${respondingTo}/respond`, { response: responseText })
    setRespondingTo(null)
    setResponseText('')
    const res = await api.get('/api/v1/reviews', { params: { pending_only: pendingOnly } })
    setReviews(res.data)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <button
          onClick={() => setPendingOnly(!pendingOnly)}
          className={pendingOnly ? 'btn-primary' : 'btn-secondary'}
        >
          {pendingOnly ? 'Show All' : 'Pending Only'}
        </button>
      </div>

      {respondingTo && (
        <div className="card mb-4">
          <h3 className="font-medium mb-2">Your Response</h3>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="input mb-2"
            rows={3}
            placeholder="Thank you for your review..."
          />
          <div className="flex gap-2">
            <button onClick={submitResponse} className="btn-primary">Submit Response</button>
            <button onClick={() => setRespondingTo(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onRespond={(id) => setRespondingTo(id)}
          />
        ))}
        {reviews.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
      </div>
    </div>
  )
}
