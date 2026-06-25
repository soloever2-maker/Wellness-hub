import { BookingCard } from './booking-card'

interface PastBooking {
  id: string
  className: string
  date: string
  time: string
  instructor: string
  status: 'attended' | 'no-show' | 'cancelled'
}

const pastBookings: PastBooking[] = [
  {
    id: '1',
    className: 'Vinyasa Flow',
    date: 'Saturday, June 29',
    time: '10:00 AM',
    instructor: 'Enjy Gebril',
    status: 'attended',
  },
  {
    id: '2',
    className: 'Power Yoga',
    date: 'Friday, June 28',
    time: '6:00 PM',
    instructor: 'Enjy Gebril',
    status: 'attended',
  },
  {
    id: '3',
    className: 'Restorative Yoga',
    date: 'Thursday, June 27',
    time: '7:00 PM',
    instructor: 'Enjy Gebril',
    status: 'no-show',
  },
  {
    id: '4',
    className: 'Mat Pilates',
    date: 'Wednesday, June 26',
    time: '5:30 PM',
    instructor: 'Enjy Gebril',
    status: 'cancelled',
  },
]

export function PastBookingsList() {
  if (pastBookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No past bookings</h2>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pastBookings.map((booking) => (
        <BookingCard
          key={booking.id}
          className={booking.className}
          date={booking.date}
          time={booking.time}
          instructor={booking.instructor}
          status={booking.status}
          isPast={true}
        />
      ))}
    </div>
  )
}
