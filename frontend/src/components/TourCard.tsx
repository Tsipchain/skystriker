import type { Tour } from '../types'

interface Props {
  tour: Tour
  onClick?: () => void
}

const categoryIcons: Record<string, string> = {
  historical: '🏛️',
  cultural: '🎭',
  adventure: '🧗',
  food: '🍽️',
  nature: '🌿',
  nightlife: '🌃',
  religious: '⛪',
  archaeological: '🏺',
}

export default function TourCard({ tour, onClick }: Props) {
  return (
    <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{categoryIcons[tour.category] || '🗺️'}</span>
            <h3 className="font-semibold text-gray-900">{tour.title}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-2">{tour.short_description || tour.city}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{tour.duration_hours}h</span>
            <span>Max {tour.max_participants} pax</span>
            <span>{tour.difficulty_level}</span>
            {tour.languages.length > 0 && <span>{tour.languages.join(', ')}</span>}
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-sky-600">{tour.price_per_person}€</p>
          <p className="text-xs text-gray-400">per person</p>
          {tour.avg_rating > 0 && (
            <p className="text-sm mt-1">⭐ {tour.avg_rating.toFixed(1)}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{tour.total_bookings} bookings</p>
        </div>
      </div>
    </div>
  )
}
