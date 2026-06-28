'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type NextBooking = {
  id: string
  session: {
    id: string
    start_time: string
    end_time: string
    class_type: { name: string }
  }
}

const classEmoji: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

function useCountdown(target: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Starting now!'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      if (h >= 24) {
        const d = Math.floor(h / 24)
        setTimeLeft(`In ${d} day${d > 1 ? 's' : ''}, ${h % 24}h`)
      } else if (h > 0) {
        setTimeLeft(`In ${h}h ${m}m`)
      } else {
        setTimeLeft(`In ${m} min`)
      }
    }
    calc()
    const interval = setInterval(calc, 60_000)
    return () => clearInterval(interval)
  }, [target])

  return timeLeft
}

export function NextBookingCard() {
  const [booking, setBooking] = useState<NextBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNext = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('bookings')
        .select('id, session:class_sessions(id, start_time, end_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .eq('status', 'confirmed')
        .order('booked_at', { ascending: true })

      // Filter future sessions client-side
      const now = new Date().toISOString()
      const upcoming = (data ?? [])
        .filter((b: any) => b.session && b.session.start_time > now)
        .sort((a: any, b: any) => a.session.start_time.localeCompare(b.session.start_time))

      if (upcoming.length > 0) setBooking(upcoming[0] as unknown as NextBooking)
      setLoading(false)
    }
    fetchNext()
  }, [])

  if (loading) return <div className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
  if (!booking) return null

  const session = booking.session
  const name = session.class_type?.name || 'Class'
  const emoji = classEmoji[name] || '🧘'
  const date = new Date(session.start_time)
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const isToday = new Date().toDateString() === date.toDateString()
  const isTomorrow = new Date(Date.now() + 86_400_000).toDateString() === date.toDateString()
  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateStr

  return <NextBookingCardUI
    emoji={emoji}
    name={name}
    timeStr={timeStr}
    dayLabel={dayLabel}
    startTime={session.start_time}
    sessionId={session.id}
  />
}

function NextBookingCardUI({
  emoji, name, timeStr, dayLabel, startTime, sessionId,
}: {
  emoji: string; name: string; timeStr: string; dayLabel: string
  startTime: string; sessionId: string
}) {
  const countdown = useCountdown(startTime)

  return (
    <Link href={`/class?id=${sessionId}`} className="block">
      <div className="bg-white border-2 border-[#006D77]/15 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-[#E86500]" />
          <span className="text-xs font-semibold text-[#E86500] uppercase tracking-wide">Next Class</span>
          <span className="flex-1" />
          <span className="text-xs font-bold text-[#006D77] bg-[#E0EEF0] px-2.5 py-0.5 rounded-full">
            {countdown}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-base">{name}</h4>
            <p className="text-sm text-muted-foreground">{dayLabel} · {timeStr}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#006D77] shrink-0" />
        </div>
      </div>
    </Link>
  )
}
