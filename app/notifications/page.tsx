'use client'

import { ArrowLeft, Bell } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          You&apos;ll see updates about your bookings, reminders, and package alerts here
        </p>
      </div>
    </main>
  )
}
