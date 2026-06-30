'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronRight, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type NextBooking = {
  id: string
  session: { id: string; start_time: string; end_time: string; class_type: { name: string } }
}

const CLASS_EMOJI: Record<string, string> = {
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
      if (h >= 24) { const d = Math.floor(h / 24); setTimeLeft(`In ${d}d ${h % 24}h`) }
      else if (h > 0) setTimeLeft(`In ${h}h ${m}m`)
      else setTimeLeft(`In ${m} min`)
    }
    calc()
    const iv = setInterval(calc, 60_000)
    return () => clearInterval(iv)
  }, [target])
  return timeLeft
}

export function NextBookingCard() {
  const [booking,      setBooking]      = useState<NextBooking | null>(null)
  const [hasPkg,       setHasPkg]       = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const now = new Date().toISOString()

      // Check active package
      const { data: pkg } = await supabase
        .from('client_packages')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .gt('sessions_remaining', 0)
        .limit(1)
        .maybeSingle()

      setHasPkg(!!pkg)

      // Check upcoming booking
      const { data } = await supabase
        .from('bookings')
        .select('id, session:class_sessions(id, start_time, end_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .eq('status', 'confirmed')
        .order('booked_at', { ascending: true })

      const upcoming = (data ?? [])
        .filter((b: any) => b.session?.start_time > now)
        .sort((a: any, b: any) => a.session.start_time.localeCompare(b.session.start_time))

      if (upcoming.length > 0) setBooking(upcoming[0] as unknown as NextBooking)
      setLoading(false)
    }
    run()
  }, [])

  if (loading) return <div className="h-20 bg-white border border-border rounded-2xl animate-pulse" />

  // Has upcoming booking — show countdown card
  if (booking) {
    const s    = booking.session
    const name = s.class_type?.name || 'Class'
    const emoji = CLASS_EMOJI[name] || '🧘'
    const date  = new Date(s.start_time)
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const isToday = new Date().toDateString() === date.toDateString()
    const isTomorrow = new Date(Date.now() + 86_400_000).toDateString() === date.toDateString()
    const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow'
      : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return <NextCard emoji={emoji} name={name} timeStr={timeStr} dayLabel={dayLabel} startTime={s.start_time} sessionId={s.id} />
  }

  // Has package but no booking — SHOW CTA
  if (hasPkg) {
    return (
      <Link href="/schedule" className="block active:scale-[0.97] transition-all">
        {/* Glowing animated border */}
        <div className="relative rounded-2xl p-[2px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #006D77, #E86500, #006D77)' }}>
          {/* Animated shimmer ring */}
          <div className="absolute inset-0 rounded-2xl animate-pulse opacity-60"
            style={{ background: 'linear-gradient(135deg, #006D77, #E86500, #006D77)' }} />
          {/* Inner card */}
          <div className="relative rounded-[14px] p-4 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #005a63 0%, #003d44 100%)' }}>
            {/* Pulsing icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" />
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center relative">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base leading-tight">
                Book your first class! 🧘
              </p>
              <p className="text-white/70 text-sm mt-0.5">
                Your sessions are waiting — tap here
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </div>
        </div>
      </Link>
    )
  }

  // No package — show nothing
  return null
}

function NextCard({ emoji, name, timeStr, dayLabel, startTime, sessionId }: {
  emoji: string; name: string; timeStr: string; dayLabel: string
  startTime: string; sessionId: string
}) {
  const countdown = useCountdown(startTime)
  return (
    <Link href={`/class?id=${sessionId}`} className="block active:scale-[0.97] transition-all">
      <div className="bg-white border-2 border-[#006D77]/15 rounded-2xl p-4 shadow-sm">
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
