'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  class_type: { name: string }
}

const classEmoji: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

export function TodaysClasses() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToday = async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from('class_sessions')
        .select('id, start_time, end_time, max_capacity, booked_count, class_type:class_types(name)')
        .eq('is_cancelled', false)
        .gte('start_time', todayStart.toISOString())
        .lte('start_time', todayEnd.toISOString())
        .order('start_time')

      if (data) setSessions(data as unknown as Session[])
      setLoading(false)
    }
    fetchToday()
  }, [])

  if (loading) return (
    <div className="h-36 bg-white border border-border rounded-2xl animate-pulse" />
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">Today&apos;s Classes</h3>
        <Link href="/schedule" className="text-sm font-medium text-[#006D77]">See All →</Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center text-center">
          <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {sessions.map(s => {
            const spotsLeft = s.max_capacity - s.booked_count
            const isFull = spotsLeft <= 0
            const time = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const name = (s.class_type as any)?.name || 'Class'
            return (
              <Link key={s.id} href={`/class?id=${s.id}`}
                className="flex-shrink-0 bg-white border border-border rounded-2xl p-4 w-44 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{classEmoji[name] || '🧘'}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{name}</h4>
                <p className="text-xs text-muted-foreground mb-3">{time}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isFull ? 'bg-red-50 text-red-500' : 'bg-[#E0EEF0] text-[#006D77]'
                  }`}>
                    {isFull ? 'Full' : `${spotsLeft} spots`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#006D77]" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
