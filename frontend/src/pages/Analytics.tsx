import { useState, useEffect } from 'react'
import api from '../api/client'
import StatsCard from '../components/StatsCard'

export default function Analytics() {
  const [revenue, setRevenue] = useState<any>(null)
  const [ratings, setRatings] = useState<any>(null)
  const [popular, setPopular] = useState<any[]>([])
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    api.get('/api/v1/analytics/revenue', { params: { days: period } })
      .then((res) => setRevenue(res.data)).catch(console.error)
    api.get('/api/v1/analytics/ratings')
      .then((res) => setRatings(res.data)).catch(console.error)
    api.get('/api/v1/analytics/popular-tours')
      .then((res) => setPopular(res.data)).catch(console.error)
  }, [period])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`text-sm px-3 py-1.5 rounded-full ${
                period === d ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {d === 365 ? '1Y' : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Net Earnings" value={`€${revenue.total_earnings}`} icon="💰" />
          <StatsCard title="Gross Revenue" value={`€${revenue.gross_revenue}`} icon="📊" />
          <StatsCard title="Bookings" value={revenue.total_bookings} icon="📅" />
          <StatsCard title="Avg per Booking" value={`€${revenue.avg_per_booking}`} icon="📈" />
        </div>
      )}

      {ratings && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">Ratings</h2>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-sky-600">{ratings.avg_rating}</p>
              <p className="text-sm text-gray-500">{ratings.total_reviews} reviews</p>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{star}⭐</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-sky-500 rounded-full h-2"
                      style={{ width: `${((ratings.distribution[star] || 0) / Math.max(ratings.total_reviews, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-400">{ratings.distribution[star] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Popular Tours</h2>
        {popular.length > 0 ? (
          <div className="space-y-2">
            {popular.map((t, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-gray-500">{t.city}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{t.bookings} bookings · ⭐{t.rating}</p>
                  <p className="text-gray-400">€{t.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No data yet.</p>
        )}
      </div>
    </div>
  )
}
