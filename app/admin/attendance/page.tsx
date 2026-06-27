'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Calendar, ChevronLeft, ChevronRight, Users, Loader2 } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  class_type: { name: string }
}

type Booking = {
  id: string
  status: string
  client_id: string
  client: { full_name: string; phone: string }
}

const classEmoji: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookingsBySession, setBookingsBySession] = useState<Record<string, Booking[]>>({})
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const isToday = new Date().toDateString() === selectedDate.toDateString()

  const shiftDay = (n: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + n)
    setSelectedDate(d)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setSessions([])
      setBookingsBySession({})
      setExpandedSession(null)

      const start = new Date(selectedDate); start.setHours(0, 0, 0, 0)
      const end = new Date(selectedDate); end.setHours(23, 59, 59, 999)

      const { data: sessionsData } = await supabase
        .from('class_sessions')
        .select('id, start_time, end_time, max_capacity, class_type:class_types(name)')
        .eq('is_cancelled', false)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

      if (!sessionsData?.length) { setLoading(false); return }
      setSessions(sessionsData as unknown as Session[])

      // Fetch bookings for all sessions
      const sessionIds = sessionsData.map(s => s.id)
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, status, client_id, client:users(full_name, phone)')
        .in('session_id', sessionIds)
        .in('status', ['confirmed', 'attended', 'no_show'])

      if (bookingsData) {
        const map: Record<string, Booking[]> = {}
        sessionsData.forEach(s => { map[s.id] = [] })
        
        // Re-fetch with session_id
        const { data: bookingsWithSession } = await supabase
          .from('bookings')
          .select('id, status, client_id, session_id, client:users(full_name, phone)')
          .in('session_id', sessionIds)
          .in('status', ['confirmed', 'attended', 'no_show'])

        bookingsWithSession?.forEach((b: any) => {
          if (!map[b.session_id]) map[b.session_id] = []
          map[b.session_id].push(b as Booking)
        })
        setBookingsBySession(map)

        // Auto-expand first session with bookings
        const firstWithBookings = sessionsData.find(s => (map[s.id] || []).length > 0)
        if (firstWithBookings) setExpandedSession(firstWithBookings.id)
      }

      setLoading(false)
    }
    fetchData()
  }, [selectedDate])

  const handleMark = async (bookingId: string, sessionId: string, newStatus: 'attended' | 'no_show') => {
    setMarkingId(bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (!error) {
      setBookingsBySession(prev => ({
        ...prev,
        [sessionId]: prev[sessionId].map(b =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        ),
      }))
    }
    setMarkingId(null)
  }

  const totalBooked = Object.values(bookingsBySession).flat().length
  const totalAttended = Object.values(bookingsBySession).flat().filter(b => b.status === 'attended').length
  const totalPending = Object.values(bookingsBySession).flat().filter(b => b.status === 'confirmed').length

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Attendance</h1>
          {totalBooked > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] font-semibold">{totalAttended} attended</span>
              {totalPending > 0 && <span className="px-2 py-1 rounded-full bg-[#FF9800]/10 text-[#FF9800] font-semibold">{totalPending} pending</span>}
            </div>
          )}
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDay(-1)} className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-foreground">
              {isToday ? '📅 Today' : dateStr}
            </p>
            {!isToday && <p className="text-xs text-muted-foreground">{dateStr}</p>}
          </div>
          <button onClick={() => shiftDay(1)} className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-[#006D77]/40" />
            </div>
            <p className="text-base font-semibold text-foreground">No classes scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Try another day</p>
          </div>
        ) : (
          sessions.map(session => {
            const name = (session.class_type as any)?.name || 'Class'
            const time = new Date(session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const endTime = new Date(session.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const bookings = bookingsBySession[session.id] || []
            const attended = bookings.filter(b => b.status === 'attended').length
            const isExpanded = expandedSession === session.id

            return (
              <div key={session.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {/* Session Header */}
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="text-3xl">{classEmoji[name] || '🧘'}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{time} – {endTime}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {bookings.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No bookings</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{bookings.length}</span>
                        </div>
                        {attended > 0 && (
                          <span className="text-xs font-semibold text-[#4CAF50]">{attended}/{bookings.length} ✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Client List (expanded) */}
                {isExpanded && bookings.length > 0 && (
                  <div className="border-t border-border">
                    {bookings.map((booking, i) => {
                      const clientName = (booking.client as any)?.full_name || '—'
                      const initials = clientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                      const isPending = booking.status === 'confirmed'
                      const isAttended = booking.status === 'attended'
                      const isNoShow = booking.status === 'no_show'
                      const isMarking = markingId === booking.id

                      return (
                        <div key={booking.id}
                          className={`flex items-center gap-3 px-4 py-3 ${i < bookings.length - 1 ? 'border-b border-border' : ''} ${
                            isAttended ? 'bg-[#4CAF50]/5' : isNoShow ? 'bg-[#E53935]/5' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isAttended ? 'bg-[#4CAF50]/20' : isNoShow ? 'bg-[#E53935]/10' : 'bg-[#E0EEF0]'
                          }`}>
                            <span className={`text-xs font-bold ${
                              isAttended ? 'text-[#4CAF50]' : isNoShow ? 'text-[#E53935]' : 'text-[#006D77]'
                            }`}>{initials}</span>
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{clientName}</p>
                            {!isPending && (
                              <p className={`text-xs font-medium ${isAttended ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>
                                {isAttended ? '✓ Attended' : '✗ No Show'}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {isMarking ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
                          ) : isPending ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMark(booking.id, session.id, 'attended')}
                                className="w-9 h-9 rounded-xl bg-[#4CAF50] flex items-center justify-center hover:bg-[#43A047] transition-colors shadow-sm"
                              >
                                <Check className="w-5 h-5 text-white" />
                              </button>
                              <button
                                onClick={() => handleMark(booking.id, session.id, 'no_show')}
                                className="w-9 h-9 rounded-xl bg-[#E53935] flex items-center justify-center hover:bg-[#C62828] transition-colors shadow-sm"
                              >
                                <X className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          ) : (
                            // Allow changing decision
                            <button
                              onClick={() => handleMark(booking.id, session.id, isAttended ? 'no_show' : 'attended')}
                              className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                            >
                              Change
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {/* Summary */}
                    {bookings.some(b => b.status !== 'confirmed') && (
                      <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {bookings.filter(b => b.status === 'confirmed').length > 0
                            ? `${bookings.filter(b => b.status === 'confirmed').length} still pending`
                            : 'All marked ✓'
                          }
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {attended}/{bookings.length} attended
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* No bookings expanded */}
                {isExpanded && bookings.length === 0 && (
                  <div className="border-t border-border px-4 py-4 text-center">
                    <p className="text-sm text-muted-foreground">No bookings for this class</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <AdminBottomNav activePage="attendance" />
    </main>
  )
}
