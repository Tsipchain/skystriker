import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import LoadingBlock from '../components/LoadingBlock'
import BookingCalendar from '../components/BookingCalendar'
import { useLang } from '../context/LanguageContext'
import type { ExperienceCard, Booking } from '../types'

export default function ExperienceDetail() {
  const { t } = useLang()
  const { slug } = useParams<{ slug: string }>()
  const [exp, setExp] = useState<ExperienceCard | null>(null)
  const [loading, setLoading] = useState(true)

  /* Booking form state */
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [guestsCount, setGuestsCount] = useState(1)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    if (!slug) return
    api.get<ExperienceCard>(`/api/v1/public/experiences/${slug}`)
      .then(setExp)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug])

  function handleBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!exp) return
    setSubmitting(true)
    setBookingError('')
    api.post<Booking>('/api/v1/public/bookings', {
      experience_id: exp.id,
      guide_id: exp.guide_id,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      requested_date: requestedDate,
      requested_time: requestedTime,
      guests_count: guestsCount,
      note,
    })
      .then(() => setBookingSuccess(true))
      .catch((err: Error) => setBookingError(err.message || 'Booking failed'))
      .finally(() => setSubmitting(false))
  }

  if (loading) return <LoadingBlock />
  if (!exp) return <p className="text-center py-20 text-gray-400">{t('experience_not_found')}</p>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero image */}
      {exp.photo_url && (
        <div className="rounded-xl overflow-hidden h-72 md:h-96 mb-8">
          <img src={exp.photo_url} alt={exp.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="card p-8 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exp.title}</h1>
            <p className="text-gray-500 mt-1">
              {exp.city_name} · {t('by')}{' '}
              <Link to={`/guides/${exp.guide_id}`} className="text-sky-600 hover:underline">
                {exp.guide_name}
              </Link>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-600">
              {exp.currency} {exp.price}
            </p>
            <p className="text-sm text-gray-500">{t('per_person')}</p>
          </div>
        </div>

        {exp.description && <p className="text-gray-600 mb-6">{exp.description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider">{t('duration')}</p>
            <p className="font-semibold text-gray-900">{exp.duration_minutes} {t('min')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider">{t('max_guests')}</p>
            <p className="font-semibold text-gray-900">{exp.max_guests}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider">{t('rating')}</p>
            <p className="font-semibold text-gray-900">{exp.avg_rating.toFixed(1)} / 5</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider">{t('category')}</p>
            <p className="font-semibold text-gray-900 capitalize">{exp.category.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {exp.languages.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            <span className="font-medium text-gray-700">{t('languages_label')}:</span> {exp.languages.join(', ')}
          </p>
        )}
      </div>

      {/* Booking calendar */}
      <div className="mb-8">
        <BookingCalendar
          guideId={exp.guide_id}
          selectedDate={requestedDate}
          onSelectDate={(date, timeRange) => {
            setRequestedDate(date)
            if (!requestedTime) {
              setRequestedTime(timeRange.split('–')[0] || '10:00')
            }
          }}
        />
      </div>

      {/* Booking form */}
      <div className="card p-8">
        <h2 className="section-title">{t('book_experience')}</h2>
        <p className="section-subtitle mb-6">{t('booking_details')}</p>

        {bookingSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
            <p className="text-emerald-800 font-semibold text-lg mb-1">{t('booking_submitted')}</p>
            <p className="text-emerald-600 text-sm">{t('booking_submitted_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_name')}</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_email')}</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('guest_phone')}</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('guests_count')}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={exp.max_guests}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('preferred_date')}</label>
                <input
                  type="date"
                  required
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('preferred_time')}</label>
                <input
                  type="time"
                  required
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('note_optional')}</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder={t('special_requests_placeholder')}
              />
            </div>

            {bookingError && (
              <p className="text-red-600 text-sm">{bookingError}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                {t('total')}: <span className="font-bold text-gray-900">{exp.currency} {exp.price * guestsCount}</span>
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {submitting ? t('submitting') : t('request_booking')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
