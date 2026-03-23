import { useEffect, useState } from 'react'
import api from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import type { AvailabilitySlot } from '../../types'

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []

  // Pad with nulls for alignment (Monday-based week)
  let startDow = firstDay.getDay()
  if (startDow === 0) startDow = 7
  for (let i = 1; i < startDow; i++) days.push(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function GuideAvailability() {
  const { t } = useLang()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [maxBookings, setMaxBookings] = useState(3)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const MONTH_NAMES = [
    t('month_jan'), t('month_feb'), t('month_mar'), t('month_apr'), t('month_may'), t('month_jun'),
    t('month_jul'), t('month_aug'), t('month_sep'), t('month_oct'), t('month_nov'), t('month_dec'),
  ]
  const DAYS = [t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat'), t('day_sun')]

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    api.get<AvailabilitySlot[]>(`/api/v1/guide/availability?month=${monthStr}`)
      .then(setSlots)
      .catch(console.error)
  }, [monthStr])

  const slotMap = new Map(slots.map((s) => [s.date, s]))
  const days = getMonthDays(year, month)
  const todayStr = fmt(today)

  function toggleDate(dateStr: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  async function saveSelected() {
    if (selected.size === 0) return
    setSaving(true)
    setMessage('')
    try {
      const result = await api.post<AvailabilitySlot[]>('/api/v1/guide/availability/bulk', {
        dates: Array.from(selected),
        start_time: startTime,
        end_time: endTime,
        max_bookings: maxBookings,
      })
      // Update local state
      const newMap = new Map(slotMap)
      result.forEach((s) => newMap.set(s.date, s))
      setSlots(Array.from(newMap.values()))
      setSelected(new Set())
      setMessage(t('dates_saved', { count: result.length }))
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(t('failed_save'))
    } finally {
      setSaving(false)
    }
  }

  async function removeSlot(slotId: string, dateStr: string) {
    try {
      await api.delete(`/api/v1/guide/availability/${slotId}`)
      setSlots((prev) => prev.filter((s) => s.id !== slotId))
    } catch (err) {
      console.error(err)
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('availability')}</h2>
      <p className="text-gray-500 text-sm mb-6">
        {t('availability_desc')}
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              &#8592;
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              &#8594;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />

              const dateStr = fmt(day)
              const isPast = dateStr < todayStr
              const slot = slotMap.get(dateStr)
              const isSelected = selected.has(dateStr)
              const hasSlot = slot && slot.is_available

              let classes = 'relative h-12 rounded-lg text-sm font-medium flex items-center justify-center transition-all cursor-pointer '
              if (isPast) {
                classes += 'text-gray-300 cursor-not-allowed bg-gray-50'
              } else if (isSelected) {
                classes += 'bg-sky-100 text-sky-700 ring-2 ring-sky-500'
              } else if (hasSlot) {
                classes += 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              } else {
                classes += 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }

              return (
                <button
                  key={dateStr}
                  disabled={isPast}
                  onClick={() => toggleDate(dateStr)}
                  className={classes}
                  title={hasSlot ? `${slot.start_time}–${slot.end_time} (${slot.max_bookings} max)` : ''}
                >
                  {day.getDate()}
                  {hasSlot && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> {t('available')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-100 border border-sky-400" /> {t('selected')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" /> {t('unavailable')}
            </span>
          </div>
        </div>

        {/* Settings panel */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('time_settings')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('start_time')}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('end_time')}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('max_bookings_day')}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxBookings}
                  onChange={(e) => setMaxBookings(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={saveSelected}
              disabled={saving || selected.size === 0}
              className="w-full mt-4 bg-sky-600 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              {saving ? t('saving') : t('save_dates', { count: selected.size })}
            </button>

            {message && (
              <p className={`text-sm mt-2 text-center ${message.includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                {message}
              </p>
            )}
          </div>

          {/* Existing slots for this month */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('this_month_slots')}</h3>
            {slots.filter((s) => s.is_available).length === 0 ? (
              <p className="text-sm text-gray-400">{t('no_dates_set')}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {slots
                  .filter((s) => s.is_available)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium text-gray-900">{s.date}</span>
                        <span className="text-gray-500 ml-2">{s.start_time}–{s.end_time}</span>
                      </div>
                      <button
                        onClick={() => removeSlot(s.id, s.date)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
