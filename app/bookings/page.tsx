'use client'

import { useState } from 'react'
import { TopBar } from '@/components/top-bar'
import { BookingsTabSwitcher } from '@/components/bookings/bookings-tab-switcher'
import { UpcomingBookingsList } from '@/components/bookings/upcoming-bookings-list'
import { PastBookingsList } from '@/components/bookings/past-bookings-list'
import { BottomNav } from '@/components/bottom-nav'

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  return (
    <main className="bg-background min-h-screen pb-24 flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <TopBar />
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-2xl font-bold text-foreground mb-6">My Bookings</h1>
          <BookingsTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-8">
        {activeTab === 'upcoming' ? (
          <UpcomingBookingsList />
        ) : (
          <PastBookingsList />
        )}
      </div>

      <BottomNav activePage="bookings" />
    </main>
  )
}
