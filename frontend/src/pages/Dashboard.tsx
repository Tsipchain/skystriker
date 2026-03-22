import { useState, useEffect } from 'react'
import api from '../api/client'
import StatsCard from '../components/StatsCard'
import BookingCard from '../components/BookingCard'
import type { DailyBriefing } from '../types'

export default function Dashboard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/v1/assistant/daily-briefing')
      .then((res) => setBriefing(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Bookings Today"
          value={briefing?.bookings_today.length || 0}
          icon="📅"
        />
        <StatsCard
          title="Participants"
          value={briefing?.total_participants || 0}
          icon="👥"
        />
        <StatsCard
          title="Revenue Today"
          value={`€${(briefing?.revenue_today || 0).toFixed(0)}`}
          icon="💰"
        />
        <StatsCard
          title="Pending Reviews"
          value={briefing?.pending_reviews || 0}
          icon="⭐"
        />
      </div>

      {briefing?.weather && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-2">Weather</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-3xl">🌤</span>
            <div>
              <p className="font-medium">{briefing.weather.city}: {briefing.weather.temperature}°C - {briefing.weather.description}</p>
              {briefing.weather.recommendation && (
                <p className="text-gray-500">{briefing.weather.recommendation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {briefing?.tips && briefing.tips.length > 0 && (
        <div className="card mb-6 bg-sky-50 border-sky-200">
          <h2 className="font-semibold text-sky-800 mb-2">Tips</h2>
          <ul className="text-sm text-sky-700 space-y-1">
            {briefing.tips.map((tip, i) => (
              <li key={i}>💡 {tip}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="font-semibold text-gray-800 mb-3">Today's Schedule</h2>
      {briefing?.bookings_today && briefing.bookings_today.length > 0 ? (
        <div className="space-y-3">
          {briefing.bookings_today.map((b, i) => (
            <div key={i} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{b.time || 'TBD'} - {b.tour}</p>
                <p className="text-sm text-gray-500">{b.customer} · {b.participants} person(s)</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No bookings today. Time to promote your tours!</p>
      )}
    </div>
  )
}
