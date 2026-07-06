// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   components/bookings/upcoming-bookings-list.tsx
// (امسح السطور التعليق دي بعد ما تنسخه لو حابب — مش لازم)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { Calendar, X, Loader2, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { checkStudioProximity, checkInWindowEnd } from '@/lib/geo'

type Booking = {
  id: string
  status: string
  client_package_id: string | null
  session: {
    id: string
    start_time: string
    end_time: string
    instructor_name?: string
    class_type: { name: string }
  }
}

export function UpcomingBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<Booking | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [checkInError, setCheckInError] = useState<{ id: string; msg: string } | null>(null)
  const [cancelWindowHours, setCancelWindowHours] = useState(12)

  useEffect(() => {
    const fetchBookings = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      // Cancellation window is admin-configurable (Settings) — fallback 12h
      supabase.from('settings').select('value').eq('key', 'cancellation_window_hours').maybeSingle()
        .then(({ data: setting }) => {
          const h = parseFloat(setting?.value)
          if (!isNaN(h) && h > 0) setCancelWindowHours(h)
        })

      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, client_package_id, session:class_sessions(id, start_time, end_time, instructor_name, class_type:class_types(name))')
        .eq('client_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .order('booked_at', { ascending: false })

      if (error) console.error('[UpcomingBookings] query error:', error)

      // Keep sessions visible until the check-in window closes
      // (end of the class day — so clients can still check in later)
      const now = Date.now()
      if (data) setBookings(
        (data
          .filter(b => {
            // Defensive: Supabase sometimes returns embedded relations as an array
            const session = Array.isArray(b.session) ? b.session[0] : b.session
            if (!session) return false
            const endMs = new Date((session as any).end_time).getTime()
            if (isNaN(endMs)) {
              console.warn('[UpcomingBookings] bad end_time for booking', b.id, session)
              return false
            }
            return checkInWindowEnd(endMs) >= now
          })
          .map(b => ({
            ...b,
            session: Array.isArray(b.session) ? b.session[0] : b.session,
          }))
          .sort((a, b) => new Date((a.session as any).start_time).getTime() - new Date((b.session as any).start_time).getTime())
        ) as unknown as Booking[]
      )
      setLoading(false)
    }
    fetchBookings()
  }, [])

  const handleCancel = async (booking: Booking) => {
    const bookingId = booking.id
    const sessionId = booking.session.id
    const hoursUntil = (new Date(booking.session.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < cancelWindowHours) {
      alert(`Cannot cancel within ${cancelWindowHours} hours of the class.`)
      setConfirmCancel(null)
      return
    }
    setCancellingId(bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (!error) {
      // Refund the session credit back to the package it was booked with
      if (booking.client_package_id) {
        const { data: pkg } = await supabase
          .from('client_packages')
          .select('sessions_remaining')
          .eq('id', booking.client_package_id)
          .single()
        if (pkg) {
          await supabase.from('client_packages')
            .update({ sessions_remaining: pkg.sessions_remaining + 1 })
            .eq('id', booking.client_package_id)
        }
      }

      // Decrement booked_count
      const { data: session } = await supabase
        .from('class_sessions').select('booked_count').eq('id', sessionId).single()
      if (session && session.booked_count > 0) {
        await supabase.from('class_sessions')
          .update({ booked_count: session.booked_count - 1 }).eq('id', sessionId)
      }

      // Waitlist cascade
      fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {})

      setBookings(prev => prev.filter(b => b.id !== bookingId))

      // Broadcast cancellation so other components (NextBookingCard, Schedule) can re-fetch
      window.dispatchEvent(new CustomEvent('booking-changed'))
    }
    setCancellingId(null)
    setConfirmCancel(null)
  }

  const handleCheckIn = async (booking: Booking) => {
    const bookingId = booking.id
    setCheckInError(null)
    setCheckingInId(bookingId)

    // Location is only enforced while the class hasn't ended yet.
    // After end_time, clients who forgot can still check in from anywhere.
    const classEnded = Date.now() > new Date(booking.session.end_time).getTime()

    if (!classEnded) {
      const result = await checkStudioProximity()

      if (!result.ok) {
        const messages: Record<string, string> = {
          denied:      'Please allow location access to check in.',
          unavailable: 'Location is not available on this device.',
          timeout:     'Could not get your location. Try again.',
          too_far:     `You're too far from the studio (${Math.round(result.distance || 0)}m away). Get within 200m to check in.`,
        }
        setCheckInError({ id: bookingId, msg: messages[result.reason] })
        setCheckingInId(null)
        return
      }
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'attended' })
      .eq('id', bookingId)

    if (!error) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'attended' } : b))
    } else {
      setCheckInError({ id: bookingId, msg: 'Something went wrong. Please try again.' })
    }
    setCheckingInId(null)
  }
  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
    </div>
  )

  if (bookings.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-[#006D77]/40" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">No upcoming bookings</h2>
      <p className="text-sm text-muted-foreground mb-6">Book a class to get started</p>
      <Link href="/schedule" className="px-6 py-2.5 bg-[#006D77] text-white font-semibold rounded-xl text-sm">
        Browse Classes
      </Link>
    </div>
  )

  return (
    <div className="space-y-3">
      {bookings.map(booking => {
        const startTime = new Date(booking.session.start_time)
        const endTime = new Date(booking.session.end_time)
        const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60)
        const canCancel = hoursUntil > cancelWindowHours
        const cancelDeadline = new Date(startTime.getTime() - cancelWindowHours * 3_600_000)
        const cancelDeadlineStr = `${cancelDeadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${cancelDeadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const name = (booking.session.class_type as any)?.name || 'Class'

        // Check-in window: opens 2 hours before start, stays open until the end of the class day
        const now = Date.now()
        const windowStart = startTime.getTime() - 2 * 60 * 60 * 1000
        const windowEnd = checkInWindowEnd(endTime)
        const isCheckInWindow = now >= windowStart && now <= windowEnd
        const classEnded = now > endTime.getTime()
        const isAttended = booking.status === 'attended'
        const showCheckIn = isCheckInWindow && !isAttended
        const isCheckingIn = checkingInId === booking.id
        const error = checkInError?.id === booking.id ? checkInError.msg : null

        return (
          <div key={booking.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isAttended ? 'bg-[#006D77]/10 text-[#006D77]' : 'bg-[#4CAF50]/10 text-[#4CAF50]'
                  }`}>
                    {isAttended ? 'Checked In ✓' : 'Confirmed ✓'}
                  </span>
                </div>
                <h3 className="font-bold text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{dateStr} · {timeStr}</p>
                <p className="text-xs text-muted-foreground mt-0.5">60 min · {(booking.session as any).instructor_name || 'Enjy Gebril'}</p>
              </div>
              {canCancel && !isAttended && (
                <button
                  onClick={() => setConfirmCancel(booking)}
                  className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>

            {canCancel && !isAttended && (
              <p className="text-xs text-muted-foreground mt-2">
                Free cancellation until <span className="font-medium text-[#006D77]">{cancelDeadlineStr}</span>
              </p>
            )}

            {!canCancel && !isCheckInWindow && hoursUntil > 0 && (
              <p className="text-xs text-[#B8612A] mt-2">⏰ Less than {cancelWindowHours}h — cannot cancel</p>
            )}

            {/* Check-in button */}
            {showCheckIn && (
              <div className="mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => handleCheckIn(booking)}
                  disabled={isCheckingIn}
                  className="w-full py-3 bg-[#006D77] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                >
                  {isCheckingIn
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {classEnded ? 'Checking you in...' : 'Checking your location...'}</>
                    : classEnded
                      ? <><CheckCircle2 className="w-4 h-4" /> Check In — I attended this class</>
                      : <><MapPin className="w-4 h-4" /> Check In — I'm at the studio</>
                  }
                </button>
                {error && (
                  <div className="flex items-start gap-1.5 mt-2 text-xs text-red-500">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {isAttended && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border text-xs text-[#006D77]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">You're checked in for this class</span>
              </div>
            )}
          </div>
        )
      })}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center px-5"
          onClick={() => setConfirmCancel(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-foreground text-center mb-2">
              Cancel This Booking?
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-1">
              {(confirmCancel.session.class_type as any)?.name || 'Class'}
            </p>
            <p className="text-sm text-muted-foreground text-center mb-3">
              {new Date(confirmCancel.session.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              {new Date(confirmCancel.session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </p>
            {confirmCancel.client_package_id && (
              <p className="text-xs text-center text-[#006D77] bg-[#E0EEF0]/60 rounded-xl px-3 py-2 mb-6">
                Your session credit will be returned to your package ✓
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-3.5 border border-border rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                disabled={cancellingId === confirmCancel.id}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {cancellingId === confirmCancel.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : 'Cancel Booking'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
