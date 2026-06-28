'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type PastBooking = {
  id: string
  status: string
  session: {
    start_time: string
    duration_minutes: number
    class_type: { name: string }
  }
}

const statusConfig = {
  attended:  { label: 'Attended', icon: Check, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10' },
  no_show:   { label: 'No Show',  icon: X,     color: 'text-[#E53935]', bg: 'bg-[#E53935]/10' },
  cancelled: { label: 'Cancelled',icon: Clock,  color: 'text-muted-foreground', bg: 'bg-muted' },
}

export function PastBookingsList() {
  const [bookings, setBookings] = useState<PastBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPast = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('bookings')
        .select('id, status, session:class_sessions(start_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .in('status', ['attended', 'no_show', 'cancelled'])
        .order('booked_at', { ascending: false })
        .limit(20)

      if (data) setBookings(data.filter(b => b.session) as unknown as PastBooking[])
      setLoading(false)
    }
    fetchPast()
  }, [])

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
    </div>
  )

  if (bookings.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">No history yet</h2>
      <p className="text-sm text-muted-foreground">Your attended classes will appear here</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {bookings.map(booking => {
        const s = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.cancelled
        const Icon = s.icon
        const startTime = new Date(booking.session.start_time)
        const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const name = (booking.session.class_type as any)?.name || 'Class'

        return (
          <div key={booking.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{dateStr} · {timeStr}</p>
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                <Icon className="w-3 h-3" /> {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
