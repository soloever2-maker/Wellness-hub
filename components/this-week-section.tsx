'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function getWeekRange() {
  const today = new Date()
  const day = today.getDay() // 0=Sun
  const sun = new Date(today)
  sun.setDate(today.getDate() - day)
  sun.setHours(0, 0, 0, 0)
  const sat = new Date(sun)
  sat.setDate(sun.getDate() + 6)
  sat.setHours(23, 59, 59, 999)
  return { sun, sat }
}

export function ThisWeekSection() {
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDay()) // 0=Sun
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { sun, sat } = getWeekRange()
    supabase
      .from('class_sessions')
      .select('id, start_time, max_capacity, booked_count, class_type:class_types(name)')
      .eq('is_cancelled', false)
      .gte('start_time', sun.toISOString())
      .lte('start_time', sat.toISOString())
      .order('start_time')
      .then(({ data }) => {
        if (data) setSessions(data as unknown as Session[])
        setLoading(false)
      })
  }, [])

  const daySessions = sessions.filter(s => {
    return new Date(s.start_time).getDay() === selectedDay
  })

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3">This Week</h3>

      {/* Day pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {DAYS.map((day, i) => {
          const isToday = i === today.getDay()
          const hasClasses = sessions.some(s => new Date(s.start_time).getDay() === i)
          return (
            <button key={day} onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all relative ${
                selectedDay === i
                  ? 'bg-[#006D77] text-white shadow-md'
                  : 'bg-white text-foreground border border-border hover:bg-muted'
              }`}>
              {day}
              {isToday && selectedDay !== i && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E86500]" />
              )}
              {hasClasses && selectedDay !== i && !isToday && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#006D77]/40" />
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
          <p className="text-sm">No classes on {DAYS[selectedDay]}</p>
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
