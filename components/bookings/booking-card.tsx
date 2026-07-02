import { Clock, User, X } from 'lucide-react'

interface BookingCardProps {
  className: string
  date: string
  time: string
  instructor: string
  status: 'confirmed' | 'attended' | 'no-show' | 'cancelled'
  canCancel?: boolean
  isPast?: boolean
  onCancel?: () => void
}

const statusConfig = {
  confirmed: { label: 'Confirmed ✓', color: 'bg-[#4CAF50]' },
  attended: { label: 'Attended ✓', color: 'bg-[#4CAF50]' },
  'no-show': { label: 'No Show ✗', color: 'bg-[#E53935]' },
  cancelled: { label: 'Cancelled', color: 'bg-[#9E9E9E]' },
}

export function BookingCard({
  className: classNameText,
  date,
  time,
  instructor,
  status,
  canCancel = false,
  isPast = false,
  onCancel,
}: BookingCardProps) {
  const config = statusConfig[status]

  return (
    <div
      className={`bg-surface border-l-4 border-l-primary rounded-lg p-4 mb-4 border border-border ${
        isPast ? 'opacity-85' : ''
      } shadow-sm`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-foreground text-base">{classNameText}</h3>
        <span className={`${config.color} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Clock className="w-4 h-4" />
          <span>
            {date} at {time}
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <User className="w-4 h-4" />
          <span>{instructor}</span>
        </div>
      </div>

      {!isPast && canCancel && (
        <button
          onClick={onCancel}
          className="text-[#E53935] text-sm font-semibold hover:underline transition-all"
        >
          Cancel Booking
        </button>
      )}

      {!isPast && !canCancel && (
        <p className="text-text-secondary italic text-xs">Cannot cancel — within 12hr window</p>
      )}
    </div>
  )
}
