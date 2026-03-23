import { useEffect, useState } from 'react'
import api from '../api/client'
import type { CalendarDay } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
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

interface Props {
  guideId: string
  onSelectDate: (date: string, timeRange: string) => void
  selectedDate?: string
}

export default function BookingCalendar({ guideId, onSelectDate, selectedDate }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calendar, setCalendar] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    setLoading(true)
    api.get<CalendarDay[]>(`/api/v1/public/guides/${guideId}/calendar?month=${monthStr}`)
      .then(setCalendar)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [guideId, monthStr])

  const calMap = new Map(calendar.map((c) => [c.date, c]))
  const days = getMonthDays(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-gray-900 mb-1">Available Dates</h3>
      <p className="text-sm text-gray-500 mb-4">Pick a date from the calendar below</p>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 text-sm">
          &#8592;
        </button>
        <span className="text-sm font-medium text-gray-700">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 text-sm">
          &#8594;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const dateStr = fmt(day)
            const cal = calMap.get(dateStr)
            const avail = cal?.is_available
            const isSelected = selectedDate === dateStr

            let cls = 'h-10 rounded text-xs font-medium flex flex-col items-center justify-center transition-all '
            if (isSelected) {
              cls += 'bg-sky-600 text-white ring-2 ring-sky-400'
            } else if (avail) {
              cls += 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
            } else {
              cls += 'text-gray-300 bg-gray-50 cursor-not-allowed'
            }

            return (
              <button
                key={dateStr}
                disabled={!avail}
                onClick={() => {
                  if (avail && cal) {
                    onSelectDate(dateStr, `${cal.start_time}–${cal.end_time}`)
                  }
                }}
                className={cls}
              >
                <span>{day.getDate()}</span>
                {avail && cal && !isSelected && (
                  <span className="text-[9px] text-emerald-500">{cal.spots_left} left</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-gray-50 border border-gray-200" /> Unavailable
        </span>
      </div>
    </div>
  )
}
