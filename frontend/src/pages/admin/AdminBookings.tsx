import { useEffect, useState } from 'react'
import api from '../../api/client'
import LoadingBlock from '../../components/LoadingBlock'
import { useLang } from '../../context/LanguageContext'
import type { Booking } from '../../types'

export default function AdminBookings() {
  const { t } = useLang()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadBookings()
  }, [filter])

  async function loadBookings() {
    setLoading(true)
    try {
      const params = filter === 'all' ? '' :
        filter === 'pending_payout' ? '?status=completed&payout_status=pending' :
        filter === 'released' ? '?payout_status=released' :
        `?status=${filter}`
      const data = await api.get<Booking[]>(`/api/v1/admin/bookings${params}`)
      setBookings(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function releasePayout(bookingId: string) {
    try {
      await api.post(`/api/v1/admin/bookings/${bookingId}/release-payout`)
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, payout_status: 'released' } : b)
      )
    } catch (e: any) {
      alert(e.message)
    }
  }

  const statusColor = (s: string) =>
    s === 'completed' ? 'bg-blue-100 text-blue-800' :
    s === 'confirmed' ? 'bg-green-100 text-green-800' :
    s === 'requested' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'

  const payoutColor = (s: string) =>
    s === 'released' ? 'bg-green-100 text-green-800' :
    s === 'paid' ? 'bg-blue-100 text-blue-800' :
    'bg-gray-100 text-gray-600'

  if (loading) return <LoadingBlock />

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('bookings_payouts')}</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ['all', t('all_bookings')],
          ['requested', 'Requested'],
          ['confirmed', 'Confirmed'],
          ['completed', 'Completed'],
          ['pending_payout', t('pending_payouts')],
          ['released', t('released')],
        ] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">{t('no_bookings_yet')}</div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{b.guest_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{b.guest_email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {b.requested_date} {b.requested_time} · {b.guests_count} {b.guests_count !== 1 ? t('guests_plural') : t('guest')}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-700 font-medium">
                      {t('total')}: {b.currency} {b.total_price.toFixed(2)}
                    </span>
                    <span className="text-orange-600">
                      {t('platform_fee_label')}: {b.currency} {b.platform_fee.toFixed(2)}
                    </span>
                    <span className="text-green-600 font-medium">
                      {t('guide_payout_label')}: {b.currency} {b.guide_payout.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payoutColor(b.payout_status)}`}>
                    {t('payout')}: {b.payout_status}
                  </span>
                  {b.status === 'completed' && b.payout_status === 'pending' && (
                    <button
                      onClick={() => releasePayout(b.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      {t('release_payout')}
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
