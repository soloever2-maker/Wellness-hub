import { useState } from 'react'
import { BookingCard } from './booking-card'

interface Booking {
  id: string
  className: string
  date: string
  time: string
  instructor: string
  status: 'confirmed'
  hoursUntilClass: number
}

const upcomingBookings: Booking[] = [
  {
    id: '1',
    className: 'Power Yoga',
    date: 'Sunday, July 6',
    time: '11:00 AM',
    instructor: 'Enjy Gebril',
    status: 'confirmed',
    hoursUntilClass: 48,
  },
  {
    id: '2',
    className: 'Mat Pilates',
    date: 'Monday, July 7',
    time: '7:30 PM',
    instructor: 'Enjy Gebril',
    status: 'confirmed',
    hoursUntilClass: 72,
  },
  {
    id: '3',
    className: 'Gentle Yoga',
    date: 'Tuesday, July 8',
    time: '8:00 AM',
    instructor: 'Enjy Gebril',
    status: 'confirmed',
    hoursUntilClass: 6,
  },
]

export function UpcomingBookingsList() {
  const [bookings, setBookings] = useState(upcomingBookings)

  const handleCancel = (id: string) => {
    setBookings(bookings.filter((b) => b.id !== id))
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No upcoming bookings</h2>
        <button className="mt-4 px-6 py-2 border-2 border-primary text-primary rounded-full font-semibold hover:bg-secondary transition-all">
          Browse Classes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          className={booking.className}
          date={booking.date}
          time={booking.time}
          instructor={booking.instructor}
          status={booking.status}
          canCancel={booking.hoursUntilClass > 12}
          onCancel={() => handleCancel(booking.id)}
        />
      ))}
    </div>
  )
}
