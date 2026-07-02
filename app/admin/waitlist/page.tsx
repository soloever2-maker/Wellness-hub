'use client'

import { ArrowLeft, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function AdminWaitlistPage() {
  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Waitlist</h1>
        </div>
      </div>

      {/* Empty State */}
      <div className="px-4 pt-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-[#006D77]/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Waitlists</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          When a class reaches full capacity and clients join the waitlist, they will appear here for you to manage.
        </p>

        <div className="mt-8 w-full max-w-sm">
          <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waitlist Flow</p>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FF9800]/10 flex items-center justify-center text-xs font-bold text-[#FF9800]">1</div>
              <p className="text-sm text-foreground">Client joins waitlist when class is full</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#006D77]/10 flex items-center justify-center text-xs font-bold text-[#006D77]">2</div>
              <p className="text-sm text-foreground">You get notified of a spot opening</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-xs font-bold text-[#4CAF50]">3</div>
              <p className="text-sm text-foreground">Promote first in line to booked</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
