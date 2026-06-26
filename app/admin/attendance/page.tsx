'use client'

import { useState } from 'react'
import { Check, X, Clock, Calendar } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

export default function AdminAttendancePage() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Empty State */}
      <div className="px-4 pt-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
          <Calendar className="w-10 h-10 text-[#006D77]/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Classes Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Once you add class sessions from the Schedule page, you&apos;ll be able to mark attendance for each booked client here.
        </p>

        <div className="mt-8 w-full max-w-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How it will work</p>
          <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Attended</p>
                <p className="text-xs text-muted-foreground">Deducts 1 session from package</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E53935]/10 flex items-center justify-center">
                <X className="w-4 h-4 text-[#E53935]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">No Show</p>
                <p className="text-xs text-muted-foreground">Also deducts 1 session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Pending</p>
                <p className="text-xs text-muted-foreground">Not yet marked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminBottomNav activePage="attendance" />
    </main>
  )
}
