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
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setBookingState('available')}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                bookingState === 'available'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setBookingState('full')}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                bookingState === 'full'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              Full
            </button>
            <button
              onClick={() => setBookingState('booked')}
              className={`text-xs px-3 py-1 rounded-full transition-all ${
                bookingState === 'booked'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              Already Booked
            </button>
          </div>
        </div>
      </div>

      <BookingSection state={bookingState} />
    </div>
  )
}
