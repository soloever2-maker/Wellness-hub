'use client'

import { useState } from 'react'
import { ClassHeader } from '@/components/class-details/class-header'
import { ClassInfoCard } from '@/components/class-details/class-info-card'
import { SpotsIndicator } from '@/components/class-details/spots-indicator'
import { AboutSection } from '@/components/class-details/about-section'
import { BookingSection } from '@/components/class-details/booking-section'

export default function ClassDetailsPage() {
  const [bookingState, setBookingState] = useState<'available' | 'full' | 'booked'>('available')

  return (
    <div className="bg-background min-h-screen">
      <ClassHeader />
      
      <div className="px-4 space-y-6 pb-40">
        <ClassInfoCard />
        <SpotsIndicator />
        <AboutSection />
      </div>

      <BookingSection
        state={bookingState}
        onBook={() => setBookingState('booked')}
        onJoinWaitlist={() => setBookingState('booked')}
        onCancel={() => setBookingState('available')}
      />
    </div>
  )
}
