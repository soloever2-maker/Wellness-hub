'use client'

// ── QR Check-in ────────────────────────────────────────────────
// The client scans the printed QR at the studio → lands here →
// we auto check them in. Zero buttons, zero permissions, zero typing.
// (Scanning the physical code IS the proof they're at the studio,
//  so no geolocation permission is needed on this path.)

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { checkInWindowStart, checkInWindowEnd } from '@/lib/geo'

type Result =
  | { state: 'loading' }
  | { state: 'success'; className: string; alreadyDone: boolean }
  | { state: 'no_class'; nextClass?: { name: string; start: string } }
  | { state: 'error' }

export default function CheckinPage() {
  const [result, setResult] = useState<Result>({ state: 'loading' })

  useEffect(() => {
    const run = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) return // AuthGuard redirects to login

        // All confirmed/attended bookings with their sessions
        const { data } = await supabase
          .from('bookings')
          .select('id, status, session:class_sessions(start_time, end_time, class_type:class_types(name))')
          .eq('client_id', user.id)
          .in('status', ['confirmed', 'attended'])

        const now = Date.now()
        const rows = ((data || []) as any[])
          .map(b => ({ ...b, session: Array.isArray(b.session) ? b.session[0] : b.session }))
          .filter(b => b.session?.start_time)

        // A booking is check-in-able for the WHOLE class day —
        // midnight to midnight, same window as My Bookings.
        // With day-long windows, multiple bookings can qualify (e.g. a
        // morning class that wasn't checked in + an evening class), so:
        //   1. prefer un-attended bookings over already-attended ones
        //   2. prefer the most recent class
        const candidates = rows
          .filter(b => {
            const start = new Date(b.session.start_time).getTime()
            const end = new Date(b.session.end_time).getTime()
            return now >= checkInWindowStart(start) &&
                   now <= checkInWindowEnd(end)
          })
          .sort((a, b) => b.session.start_time.localeCompare(a.session.start_time))

        const inWindow = candidates.find(b => b.status !== 'attended') || candidates[0]

        if (inWindow) {
          const className = inWindow.session.class_type?.name || 'your class'

          if (inWindow.status === 'attended') {
            setResult({ state: 'success', className, alreadyDone: true })
            return
          }

          const { error } = await supabase
            .from('bookings')
            .update({ status: 'attended' })
            .eq('id', inWindow.id)

          if (error) setResult({ state: 'error' })
          else setResult({ state: 'success', className, alreadyDone: false })
          return
        }

        // No class right now — show their next one if any
        const upcoming = rows
          .filter(b => new Date(b.session.start_time).getTime() > now && b.status === 'confirmed')
          .sort((a, b) => a.session.start_time.localeCompare(b.session.start_time))[0]

        setResult({
          state: 'no_class',
          nextClass: upcoming
            ? { name: upcoming.session.class_type?.name || 'Class', start: upcoming.session.start_time }
            : undefined,
        })
      } catch {
        setResult({ state: 'error' })
      }
    }
    run()
  }, [])

  return (
    <main className="bg-background min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">

        {result.state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#006D77]" />
            <p className="text-sm text-muted-foreground">Checking you in...</p>
          </div>
        )}

        {result.state === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {result.alreadyDone ? "You're already checked in ✓" : "You're checked in! 🎉"}
              </h1>
              <p className="text-muted-foreground mt-2">
                Enjoy <span className="font-semibold text-[#006D77]">{result.className}</span> 🧘‍♀️
              </p>
            </div>
            <Link href="/" className="mt-4 px-8 py-3 rounded-full bg-[#006D77] text-white text-sm font-semibold">
              Done
            </Link>
          </div>
        )}

        {result.state === 'no_class' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#E0EEF0] flex items-center justify-center">
              <Calendar className="w-12 h-12 text-[#006D77]/40" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">No class to check in right now</h1>
              {result.nextClass ? (
                <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Your next class: <span className="font-semibold text-[#006D77]">{result.nextClass.name}</span>
                  {' · '}
                  {new Date(result.nextClass.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Check-in opens 2 hours before your booked class.
                </p>
              )}
            </div>
            <Link href="/schedule" className="mt-4 px-8 py-3 rounded-full bg-[#006D77] text-white text-sm font-semibold">
              View Schedule
            </Link>
          </div>
        )}

        {result.state === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              Please try scanning again, or ask Enjy to check you in.
            </p>
            <button onClick={() => window.location.reload()}
              className="mt-2 px-8 py-3 rounded-full bg-[#006D77] text-white text-sm font-semibold">
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
