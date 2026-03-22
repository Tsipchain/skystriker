import { useState, useEffect } from 'react'
import api from '../api/client'
import BookingCard from '../components/BookingCard'
import type { Booking } from '../types'

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [filter])

  const loadBookings = () => {
    const params = filter ? { status: filter } : {}
    api.get('/api/v1/bookings', { params })
      .then((res) => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleConfirm = async (id: string) => {
    await api.patch(`/api/v1/bookings/${id}/confirm`)
    loadBookings()
  }

  const handleComplete = async (id: string) => {
    await api.patch(`/api/v1/bookings/${id}/complete`)
    loadBookings()
  }

  const statuses = ['', 'pending', 'confirmed', 'completed', 'cancelled']

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      <div className="flex gap-2 mb-6">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full ${
              filter === s ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400">No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
