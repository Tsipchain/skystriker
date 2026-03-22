import type { Review } from '../types'

interface Props {
  review: Review
  onRespond?: (id: string) => void
}

export default function ReviewCard({ review, onRespond }: Props) {
  const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating)
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-medium text-gray-900">{review.customer_name}</p>
          <p className="text-sm">{stars}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('el-GR')}</p>
          {review.is_verified && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
          )}
        </div>
      </div>
      {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
      {review.comment && <p className="text-sm text-gray-600 mb-3">{review.comment}</p>}
      {review.guide_response ? (
        <div className="bg-sky-50 p-3 rounded-lg text-sm">
          <p className="text-xs text-sky-600 font-medium mb-1">Your response:</p>
          <p className="text-gray-700">{review.guide_response}</p>
        </div>
      ) : onRespond ? (
        <button onClick={() => onRespond(review.id)} className="text-sm text-sky-600 hover:text-sky-700 font-medium">
          Respond to review
        </button>
      ) : null}
    </div>
  )
}
