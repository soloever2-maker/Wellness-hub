'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  is_cancelled: boolean
  class_type: { id: string; name: string }
}

type ClassType = { id: string; name: string }

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const colorByName: Record<string, string> = {
  'Power Yoga':             'bg-[#006D77] text-white',
  'Mat Pilates':            'bg-[#E86500] text-white',
  'Belly Rhythmic Dancing': 'bg-[#006D77] text-white',
  'Aqua Aerobics':          'bg-[#E86500] text-white',
  'Gentle Yoga & Recovery': 'bg-[#FFD9B8] text-[#006D77]',
}

function getWeekDates(offset: number) {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 6 ? 0 : -(day + 1)
  const sat = new Date(today)
  sat.setDate(today.getDate() + diff + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat)
    d.setDate(sat.getDate() + i)
    return d
  })
}

export default function AdminSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addDay, setAddDay] = useState<Date | null>(null)
  const [newSession, setNewSession] = useState({ class_type_id: '', time: '', capacity: 12 })
  const [saving, setSaving] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const weekDates = getWeekDates(weekOffset)
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  useEffect(() => {
    supabase.from('class_types').select('id, name').then(({ data }) => {
      if (data) {
        setClassTypes(data)
        if (data[0]) setNewSession(s => ({ ...s, class_type_id: data[0].id }))
      }
    })
  }, [])

  useEffect(() => {
    const fetchWeek = async () => {
      setLoading(true)
      const start = new Date(weekDates[0]); start.setHours(0, 0, 0, 0)
      const end = new Date(weekDates[6]); end.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from('class_sessions')
        .select('id, start_time, end_time, max_capacity, booked_count, is_cancelled, class_type:class_types(id, name)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

      if (data) setSessions(data as unknown as Session[])
      setLoading(false)
    }
    fetchWeek()
  }, [weekOffset])

  const handleAddSession = async () => {
    if (!addDay || !newSession.class_type_id || !newSession.time) return
    setSaving(true)

    const [h, m] = newSession.time.split(':').map(Number)
    const start = new Date(addDay)
    start.setHours(h, m, 0, 0)
    const end = new Date(start)
    end.setHours(h + 1, m, 0, 0)

    const { data } = await supabase.from('class_sessions').insert({
      class_type_id: newSession.class_type_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      max_capacity: newSession.capacity,
      booked_count: 0,
      is_cancelled: false,
    }).select('id, start_time, end_time, max_capacity, booked_count, is_cancelled, class_type:class_types(id, name)').single()

    if (data) setSessions(prev => [...prev, data as unknown as Session].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ))

    setSaving(false)
    setShowAddModal(false)
    setNewSession(s => ({ ...s, time: '', capacity: 12 }))
  }

  const handleCancel = async (sessionId: string) => {
    setCancellingId(sessionId)
    await supabase.from('class_sessions').update({ is_cancelled: true }).eq('id', sessionId)
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_cancelled: true } : s))
    setCancellingId(null)
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Manage Schedule</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-1">{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
        </div>
      ) : (
        <div className="px-4 pt-4">
          {/* Week grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {DAYS.map((day, i) => {
              const date = weekDates[i]
              const isToday = date?.toDateString() === new Date().toDateString()
              return (
                <div key={day} className="text-center pb-2">
                  <p className="text-xs text-muted-foreground">{day}</p>
                  <p className={`text-sm font-bold ${isToday ? 'text-[#E86500]' : 'text-foreground'}`}>
                    {date?.getDate()}
                  </p>
                </div>
              )
            })}

            {/* Day columns */}
            {weekDates.map((date, i) => {
              const daySessions = sessions.filter(s =>
                new Date(s.start_time).toDateString() === date.toDateString()
              )
              return (
                <div key={i} className="min-h-[160px] flex flex-col gap-1">
                  {daySessions.map(s => {
                    const name = (s.class_type as any)?.name || ''
                    const time = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })
                    const color = colorByName[name] || 'bg-muted text-foreground'
                    return (
                      <div key={s.id} className={`relative rounded-lg p-1.5 text-xs ${color} ${s.is_cancelled ? 'opacity-40 line-through' : ''}`}>
                        <p className="font-semibold text-[10px] leading-tight line-clamp-1">{name}</p>
                        <p className="text-[10px] opacity-80">{time}</p>
                        <p className="text-[10px] opacity-70">{s.booked_count}/{s.max_capacity}</p>
                        {!s.is_cancelled && (
                          <button onClick={() => handleCancel(s.id)}
                            disabled={cancellingId === s.id}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40">
                            {cancellingId === s.id
                              ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              : <X className="w-2.5 h-2.5" />
                            }
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {/* Add button */}
                  <button onClick={() => { setAddDay(date); setShowAddModal(true) }}
                    className="w-full h-7 rounded-lg border border-dashed border-border flex items-center justify-center hover:bg-muted/40 transition-colors mt-auto">
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => { setAddDay(new Date()); setShowAddModal(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#006D77] text-white shadow-lg flex items-center justify-center hover:bg-[#004E5C] transition-colors">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-end" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-28 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Add Class</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addDay && (
              <p className="text-sm text-[#006D77] font-medium">
                📅 {addDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Class Type</label>
              <select value={newSession.class_type_id}
                onChange={e => setNewSession(s => ({ ...s, class_type_id: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30">
                {classTypes.map(ct => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Time</label>
                <input type="time" value={newSession.time}
                  onChange={e => setNewSession(s => ({ ...s, time: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Capacity</label>
                <input type="number" value={newSession.capacity} min={1} max={50}
                  onChange={e => setNewSession(s => ({ ...s, capacity: +e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
              </div>
            </div>

            <button onClick={handleAddSession}
              disabled={saving || !newSession.time || !newSession.class_type_id}
              className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Add to Schedule</>}
            </button>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="schedule" />
    </main>
  )
}
