import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { Booking } from '../../types'

export default function GuideBookingRequests() {
  const { t } = useLang()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Booking[]>('/api/v1/guide/bookings')
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: 'confirm' | 'decline' | 'complete') {
    try {
      await api.post(`/api/v1/guide/bookings/${id}/${action}`)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: action === 'confirm' ? 'confirmed' : action === 'decline' ? 'declined' : 'completed' }
            : b
        )
      )
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('booking_requests')}</h2>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">{t('no_bookings_yet')}</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{b.guest_name}</h3>
                  <p className="text-sm text-gray-500">{b.guest_email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {b.requested_date} at {b.requested_time} · {b.guests_count} {b.guests_count !== 1 ? t('guests_plural') : t('guest')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('total')}: {b.currency} {b.total_price.toFixed(2)}
                    {b.guide_payout > 0 && (
                      <span className="text-green-600 font-medium ml-2">
                        ({t('your_payout')}: {b.currency} {b.guide_payout.toFixed(2)})
                      </span>
                    )}
                  </p>
                  {b.note && <p className="text-sm text-gray-400 mt-1 italic">"{b.note}"</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={
                    b.status === 'confirmed' ? 'badge-verified' :
                    b.status === 'requested' ? 'badge-pending' :
                    b.status === 'completed' ? 'badge bg-blue-100 text-blue-800' :
                    'badge bg-red-100 text-red-800'
                  }>
                    {b.status}
                  </span>
                  {b.status === 'requested' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(b.id, 'confirm')} className="text-xs btn-primary py-1 px-3">
                        {t('confirm')}
                      </button>
                      <button onClick={() => handleAction(b.id, 'decline')} className="text-xs btn-secondary py-1 px-3">
                        {t('decline')}
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button onClick={() => handleAction(b.id, 'complete')} className="text-xs btn-primary py-1 px-3">
                      {t('mark_complete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
