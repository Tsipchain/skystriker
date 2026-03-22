import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import type { Tour } from '../types'

export default function PublicTourView() {
  const { tourId } = useParams()
  const [tour, setTour] = useState<Tour | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [bookingForm, setBookingForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    tour_date: '', tour_time: '09:00', participants_count: 1,
  })
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    if (tourId) {
      api.get(`/api/v1/public/tours/${tourId}`).then((res) => setTour(res.data)).catch(console.error)
      api.get(`/api/v1/public/tours/${tourId}/reviews`).then((res) => setReviews(res.data)).catch(console.error)
    }
  }, [tourId])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/api/v1/bookings', {
        tour_id: tourId,
        ...bookingForm,
        tour_date: new Date(bookingForm.tour_date).toISOString(),
      })
      setBooking(res.data)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Booking failed')
    }
  }

  if (!tour) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sky-900 text-white py-4 px-6">
        <h1 className="text-xl font-bold">SkyStriker</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="card mb-6">
          <h1 className="text-2xl font-bold mb-2">{tour.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
            <span>{tour.city}, {tour.country}</span>
            <span>·</span>
            <span>{tour.duration_hours}h</span>
            <span>·</span>
            <span>{tour.difficulty_level}</span>
            {tour.avg_rating > 0 && <><span>·</span><span>⭐ {tour.avg_rating.toFixed(1)}</span></>}
          </div>
          <p className="text-gray-700 mb-4">{tour.description}</p>

          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="font-medium text-gray-500">Price</p>
              <p className="text-xl font-bold text-sky-600">{tour.price_per_person}€ <span className="text-sm font-normal">/ person</span></p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Participants</p>
              <p>{tour.min_participants} - {tour.max_participants}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Languages</p>
              <p>{tour.languages.join(', ')}</p>
            </div>
          </div>

          {tour.included_items.length > 0 && (
            <div className="mb-3">
              <p className="font-medium text-sm text-gray-500">Included</p>
              <p className="text-sm">{tour.included_items.map((i) => `✅ ${i}`).join(' ')}</p>
            </div>
          )}
          {tour.what_to_bring.length > 0 && (
            <div>
              <p className="font-medium text-sm text-gray-500">What to bring</p>
              <p className="text-sm">{tour.what_to_bring.map((i) => `🎒 ${i}`).join(' ')}</p>
            </div>
          )}
        </div>

        {booking ? (
          <div className="card bg-green-50 border-green-200 text-center">
            <p className="text-2xl mb-2">Booking Confirmed!</p>
            <p className="text-lg font-bold text-green-700">Code: {booking.confirmation_code}</p>
            <p className="text-sm text-gray-600 mt-2">
              Total: {booking.total_price}€ · {booking.participants_count} person(s)
            </p>
            <p className="text-sm text-gray-500 mt-1">Confirmation sent to {booking.customer_email}</p>
          </div>
        ) : (
          <form onSubmit={handleBook} className="card">
            <h2 className="font-semibold mb-4">Book This Tour</h2>
            <div className="grid grid-cols-2 gap-4">
              <input value={bookingForm.customer_name} onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                className="input" placeholder="Your name" required />
              <input type="email" value={bookingForm.customer_email} onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                className="input" placeholder="Email" required />
              <input type="date" value={bookingForm.tour_date} onChange={(e) => setBookingForm({ ...bookingForm, tour_date: e.target.value })}
                className="input" required />
              <input type="number" value={bookingForm.participants_count} onChange={(e) => setBookingForm({ ...bookingForm, participants_count: +e.target.value })}
                className="input" min={1} max={tour.max_participants} />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-lg font-bold">Total: {(tour.price_per_person * bookingForm.participants_count).toFixed(0)}€</p>
              <button type="submit" className="btn-primary">Book Now</button>
            </div>
          </form>
        )}

        {reviews.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-3">Reviews</h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex justify-between">
                    <p className="font-medium">{r.customer_name}</p>
                    <p>{'⭐'.repeat(r.rating)}</p>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  {r.guide_response && (
                    <div className="bg-sky-50 p-2 rounded mt-2 text-sm">
                      <p className="text-sky-600 font-medium text-xs">Guide response:</p>
                      <p>{r.guide_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
