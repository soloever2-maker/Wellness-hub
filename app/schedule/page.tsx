// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/schedule/page.tsx
// (امسح السطور التعليق دي بعد ما تنسخه لو حابب — مش لازم)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  start_time: string
  60: number
  max_capacity: number
  booked_count: number
  class_type: { name: string; color: string }
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const classEmoji: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}
const colorMap: Record<string, string> = {
  teal:   'bg-[#006D77] text-white',
  orange: 'bg-[#E86500] text-white',
  peach:  'bg-[#FFD9B8] text-[#E86500]',
  green:  'bg-[#E0EEF0] text-[#006D77]',
}

function getWeekDates(offset: number) {
  const today = new Date()
  // Start from Saturday (day 6)
  const day = today.getDay()
  const diff = day === 6 ? 0 : -(day + 1) // go back to Saturday
  const sat = new Date(today)
  sat.setDate(today.getDate() + diff + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat)
    d.setDate(sat.getDate() + i)
    return d
  })
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 6 ? 0 : ((new Date().getDay() + 1) % 7))
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(weekOffset)

  // Set selected day to today on first load
  useEffect(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sun, 6=Sat
    // Map to our week index (Sat=0, Sun=1, ..., Fri=6)
    const idx = dayOfWeek === 6 ? 0 : dayOfWeek + 1
    setSelectedDay(idx)
  }, [])

  useEffect(() => {
    const fetchWeek = async () => {
      setLoading(true)
      const start = weekDates[0]
      start.setHours(0, 0, 0, 0)
      const end = weekDates[6]
      end.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from('class_sessions')
        .select('id, start_time, end_time, max_capacity, booked_count, instructor_name, class_type:class_types(name)')
        .eq('is_cancelled', false)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

      if (data) {
        const ids = data.map(s => s.id)
        const { data: bookings } = await supabase
          .from('bookings').select('session_id')
          .in('session_id', ids).eq('status', 'confirmed')

        const counts: Record<string, number> = {}
        bookings?.forEach(b => { counts[b.session_id] = (counts[b.session_id] || 0) + 1 })

        setSessions(data.map(s => ({ ...s, booked_count: counts[s.id] || 0 })) as unknown as Session[])
      }
      setLoading(false)
    }
    fetchWeek()
  }, [weekOffset])

  const selectedDate = weekDates[selectedDay]
  const daySessions = sessions.filter(s => {
    const d = new Date(s.start_time)
    return d.toDateString() === selectedDate?.toDateString()
  })

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <main className="bg-background min-h-screen pb-24">
      <TopBar />
      {/* Header */}
      <div className="sticky top-14 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">Schedule</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground px-1">{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-1">
          {DAYS.map((day, i) => {
            const date = weekDates[i]
            const isToday = date?.toDateString() === new Date().toDateString()
            const hasSessions = sessions.some(s => new Date(s.start_time).toDateString() === date?.toDateString())
            return (
              <button key={day} onClick={() => setSelectedDay(i)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
                  selectedDay === i
                    ? 'bg-[#006D77] text-white'
                    : 'text-foreground hover:bg-muted/40'
                }`}
              >
                <span className="text-[10px] font-medium">{day}</span>
                <span className={`text-sm font-bold mt-0.5 ${isToday && selectedDay !== i ? 'text-[#E86500]' : ''}`}>
                  {date?.getDate()}
                </span>
                {hasSessions && selectedDay !== i && (
                  <div className="w-1 h-1 rounded-full bg-[#E86500] mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sessions */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : daySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-3">
              <Calendar className="w-8 h-8 text-[#006D77]/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No classes today</p>
            <p className="text-xs text-muted-foreground mt-1">Try another day</p>
          </div>
        ) : (
          daySessions.map(s => {
            const spotsLeft = s.max_capacity - s.booked_count
            const isFull = spotsLeft <= 0
            const time = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            const name = (s.class_type as any)?.name || 'Class'
            const colorKey = (s.class_type as any)?.name?.includes('Pilates') ? 'orange' : (s.class_type as any)?.name?.includes('Dancing') ? 'peach' : (s.class_type as any)?.name?.includes('Gentle') ? 'green' : 'teal'

            return (
              <Link key={s.id} href={`/class?id=${s.id}`}>
                <div className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${colorMap[colorKey] || colorMap.teal}`}>
                    {classEmoji[name] || '🧘'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{time} · 60 min</p>
                    <p className="text-xs text-muted-foreground">{(s as any).instructor_name || 'Enjy Gebril'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isFull
                        ? 'bg-red-50 text-red-500'
                        : spotsLeft <= 3
                        ? 'bg-[#FFD9B8]/40 text-[#E86500]'
                        : 'bg-[#E0EEF0] text-[#006D77]'
                    }`}>
                      {isFull ? 'Full' : `${spotsLeft} spots`}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <BottomNav activePage="schedule" />
    </main>
  )
}
