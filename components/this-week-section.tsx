'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const classEmoji: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

type Session = {
  id: string
  start_time: string
  max_capacity: number
  booked_count: number
  class_type: { name: string }
}

// Build 7 days starting from today
function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

export function ThisWeekSection() {
  const days = getNext7Days()
  const [selectedIdx, setSelectedIdx] = useState(0) // today
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const start = days[0]
    const end = new Date(days[6])
    end.setHours(23, 59, 59, 999)

    supabase
      .from('class_sessions')
      .select('id, start_time, max_capacity, booked_count, class_type:class_types(name)')
      .eq('is_cancelled', false)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time')
      .then(async ({ data }) => {
        if (data) {
          // Compute live counts from actual bookings — stored booked_count can drift
          const ids = data.map(s => s.id)
          const { data: liveBookings } = await supabase
            .from('bookings').select('session_id')
            .in('session_id', ids).eq('status', 'confirmed')

          const counts: Record<string, number> = {}
          liveBookings?.forEach(b => { counts[b.session_id] = (counts[b.session_id] || 0) + 1 })

          setSessions(data.map(s => ({ ...s, booked_count: counts[s.id] || 0 })) as unknown as Session[])
        }
        setLoading(false)
      })
  }, [])

  // Filter sessions for selected day by matching date string
  const selectedDate = days[selectedIdx]
  const daySessions = sessions.filter(s => {
    const d = new Date(s.start_time)
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    )
  })

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3">This Week</h3>

      {/* Day pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {days.map((date, i) => {
          const isToday = i === 0
          const hasClasses = sessions.some(s => {
            const d = new Date(s.start_time)
            return d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
          })
          return (
            <button key={i} onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all relative ${
                selectedIdx === i
                  ? 'bg-[#006D77] text-white shadow-md'
                  : 'bg-white text-foreground border border-border hover:bg-muted'
              }`}>
              <span className="text-[10px] font-medium">{DAY_NAMES[date.getDay()]}</span>
              <span className={`text-sm font-bold mt-0.5 ${isToday && selectedIdx !== i ? 'text-[#E86500]' : ''}`}>
                {date.getDate()}
              </span>
              {hasClasses && selectedIdx !== i && (
                <span className="w-1 h-1 rounded-full bg-[#E86500] mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Sessions */}
      {loading ? (
        <div className="h-20 bg-white border border-border rounded-xl animate-pulse" />
      ) : daySessions.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3 text-muted-foreground">
          <Calendar className="w-5 h-5" />
          <p className="text-sm">No classes on {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {daySessions.map(s => {
            const name = (s.class_type as any)?.name || 'Class'
            const time = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const spotsLeft = s.max_capacity - s.booked_count
            const isFull = spotsLeft <= 0
            return (
              <Link key={s.id} href={`/class?id=${s.id}`}
                className="bg-white border border-border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-shadow block">
                <span className="text-2xl">{classEmoji[name] || '🧘'}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{time} · Enjy</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isFull ? 'bg-red-50 text-red-500' : 'bg-[#E0EEF0] text-[#006D77]'
                }`}>
                  {isFull ? 'Full' : `${spotsLeft} spots`}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
