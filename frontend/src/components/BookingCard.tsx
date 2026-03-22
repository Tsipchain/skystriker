import type { Booking } from '../types'

interface Props {
  booking: Booking
  onConfirm?: (id: string) => void
  onComplete?: (id: string) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
}

export default function BookingCard({ booking, onConfirm, onComplete }: Props) {
  const date = new Date(booking.tour_date)
  return (
    <div className="card flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status] || 'bg-gray-100'}`}>
            {booking.status}
          </span>
          <span className="text-xs text-gray-400">#{booking.confirmation_code}</span>
        </div>
        <p className="font-medium text-gray-900">{booking.customer_name}</p>
        <p className="text-sm text-gray-500">
          {date.toLocaleDateString('el-GR')} {booking.tour_time || ''} · {booking.participants_count} person(s)
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">{booking.guide_payout.toFixed(0)}€</p>
        <p className="text-xs text-gray-400">payout</p>
        <div className="flex gap-1 mt-2">
          {booking.status === 'pending' && onConfirm && (
            <button onClick={() => onConfirm(booking.id)} className="text-xs btn-primary py-1 px-2">
              Confirm
            </button>
          )}
          {booking.status === 'confirmed' && onComplete && (
            <button onClick={() => onComplete(booking.id)} className="text-xs btn-primary py-1 px-2">
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
