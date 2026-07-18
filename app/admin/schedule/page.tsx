'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar, Pencil, CopyPlus } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  is_cancelled: boolean
  instructor_name: string
  class_type: { id: string; name: string }
}

type ClassType = { id: string; name: string }

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const colorByName: Record<string, string> = {
  'Power Yoga':             'bg-[#006D77] text-white',
  'Mat Pilates':            'bg-[#B8612A] text-white',
  'Belly Rhythmic Dancing': 'bg-[#006D77] text-white',
  'Aqua Aerobics':          'bg-[#B8612A] text-white',
  'Gentle Yoga & Recovery': 'bg-[#EDD7C9] text-[#006D77]',
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSession, setNewSession] = useState({ class_type_id: '', time: '', capacity: 12, instructor_name: 'Enjy Gebril' })
  const [saving, setSaving] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)
  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
        .select('id, start_time, end_time, max_capacity, booked_count, is_cancelled, instructor_name, class_type:class_types(id, name)')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

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
    }
    fetchWeek()
  }, [weekOffset, refreshKey])

  // نسخ آخر أسبوع فيه حصص (بآخر تعديلات اتعملت عليه) إلى الأسبوع المعروض حاليًا
  const handleCopyLastWeek = async () => {
    setCopying(true)
    setCopyMsg(null)

    const weekStart = new Date(weekDates[0]); weekStart.setHours(0, 0, 0, 0)

    // 1) هات آخر حصة (غير ملغية) قبل بداية الأسبوع الحالي — دى بتحدد "آخر أسبوع معدَّل"
    const { data: lastSession } = await supabase
      .from('class_sessions')
      .select('start_time')
      .lt('start_time', weekStart.toISOString())
      .eq('is_cancelled', false)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastSession) {
      setCopyMsg('لا يوجد أسبوع سابق به حصص لنسخه')
      setCopying(false)
      setShowCopyConfirm(false)
      return
    }

    // 2) حدد حدود أسبوع المصدر (سبت → جمعة) اللى فيه آخر حصة
    const src = new Date(lastSession.start_time)
    const srcDay = src.getDay()
    const srcDiff = srcDay === 6 ? 0 : -(srcDay + 1)
    const srcSat = new Date(src)
    srcSat.setDate(src.getDate() + srcDiff)
    srcSat.setHours(0, 0, 0, 0)
    const srcEnd = new Date(srcSat)
    srcEnd.setDate(srcSat.getDate() + 7)

    // 3) هات كل حصص أسبوع المصدر (الغير ملغية) — دى نسخة بآخر تعديلات
    const { data: srcSessions } = await supabase
      .from('class_sessions')
      .select('class_type_id, start_time, end_time, max_capacity, instructor_name')
      .gte('start_time', srcSat.toISOString())
      .lt('start_time', srcEnd.toISOString())
      .eq('is_cancelled', false)

    if (!srcSessions || srcSessions.length === 0) {
      setCopyMsg('لا يوجد أسبوع سابق به حصص لنسخه')
      setCopying(false)
      setShowCopyConfirm(false)
      return
    }

    // 4) ابنى الحصص الجديدة بنفس اليوم والساعة المحلية (آمن ضد التوقيت الصيفى)
    const rows = srcSessions.map(s => {
      const sStart = new Date(s.start_time)
      const sEnd = new Date(s.end_time)
      const dayIndex = Math.floor((sStart.getTime() - srcSat.getTime()) / 86400000)

      const nStart = new Date(weekDates[dayIndex])
      nStart.setHours(sStart.getHours(), sStart.getMinutes(), 0, 0)
      const nEnd = new Date(weekDates[dayIndex])
      nEnd.setHours(sEnd.getHours(), sEnd.getMinutes(), 0, 0)
      if (nEnd <= nStart) nEnd.setDate(nEnd.getDate() + 1)

      return {
        class_type_id: s.class_type_id,
        start_time: nStart.toISOString(),
        end_time: nEnd.toISOString(),
        max_capacity: s.max_capacity,
        booked_count: 0,
        is_cancelled: false,
        instructor_name: s.instructor_name || 'Enjy Gebril',
      }
    })

    // 5) تجنّب التكرار: استبعد أى حصة موجودة فعلًا بنفس الكلاس ونفس الوقت فى الأسبوع الحالى
    const existingKeys = new Set(
      sessions.map(s => `${(s.class_type as any)?.id}|${new Date(s.start_time).getTime()}`)
    )
    const toInsert = rows.filter(
      r => !existingKeys.has(`${r.class_type_id}|${new Date(r.start_time).getTime()}`)
    )

    if (toInsert.length === 0) {
      setCopyMsg('كل حصص الأسبوع السابق موجودة بالفعل فى هذا الأسبوع')
    } else {
      const { error } = await supabase.from('class_sessions').insert(toInsert)
      setCopyMsg(error
        ? 'حدث خطأ أثناء النسخ، حاول مرة أخرى'
        : `تم نسخ ${toInsert.length} حصة من آخر أسبوع معدَّل ✅`)
      if (!error) setRefreshKey(k => k + 1)
    }

    setCopying(false)
    setShowCopyConfirm(false)
    setTimeout(() => setCopyMsg(null), 4000)
  }

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
      instructor_name: newSession.instructor_name.trim() || 'Enjy Gebril',
    }).select('id, start_time, end_time, max_capacity, booked_count, is_cancelled, class_type:class_types(id, name)').single()

    if (data) setSessions(prev => [...prev, data as unknown as Session].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ))

    setSaving(false)
    setShowAddModal(false)
    setNewSession(s => ({ ...s, time: '', capacity: 12, instructor_name: 'Enjy Gebril' }))
  }

  // فتح المودال في وضع التعديل وتعبئته ببيانات الكلاس
  const openEdit = (s: Session) => {
    const d = new Date(s.start_time)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    setEditingId(s.id)
    setAddDay(d)
    setNewSession({
      class_type_id: (s.class_type as any)?.id || '',
      time: `${hh}:${mm}`,
      capacity: s.max_capacity,
      instructor_name: s.instructor_name || 'Enjy Gebril',
    })
    setShowAddModal(true)
  }

  // إغلاق المودال وتصفير وضع التعديل
  const closeModal = () => {
    setShowAddModal(false)
    setEditingId(null)
    setNewSession(s => ({ ...s, time: '', capacity: 12, instructor_name: 'Enjy Gebril' }))
  }

  const handleUpdateSession = async () => {
    if (!editingId || !addDay || !newSession.class_type_id || !newSession.time) return
    setSaving(true)

    const [h, m] = newSession.time.split(':').map(Number)
    const start = new Date(addDay)
    start.setHours(h, m, 0, 0)
    const end = new Date(start)
    end.setHours(h + 1, m, 0, 0)

    const { data } = await supabase.from('class_sessions').update({
      class_type_id: newSession.class_type_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      max_capacity: newSession.capacity,
      instructor_name: newSession.instructor_name.trim() || 'Enjy Gebril',
    }).eq('id', editingId)
      .select('id, start_time, end_time, max_capacity, booked_count, is_cancelled, instructor_name, class_type:class_types(id, name)').single()

    if (data) {
      setSessions(prev => prev.map(s =>
        s.id === editingId ? { ...(data as unknown as Session), booked_count: s.booked_count } : s
      ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()))
    }

    setSaving(false)
    closeModal()
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
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Manage Schedule</h1>
          <UserMenu variant="admin" />
        </div>
        <div className="flex items-center justify-between">
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
          <button onClick={() => setShowCopyConfirm(true)}
            disabled={copying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#006D77] text-white text-xs font-semibold hover:bg-[#004E5C] transition-colors disabled:opacity-60">
            {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CopyPlus className="w-3.5 h-3.5" />}
            Copy Last Week
          </button>
        </div>
        {copyMsg && (
          <div className="text-xs font-medium text-[#006D77] bg-[#006D77]/10 rounded-lg px-3 py-2" dir="auto">
            {copyMsg}
          </div>
        )}
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
                  <p className={`text-sm font-bold ${isToday ? 'text-[#B8612A]' : 'text-foreground'}`}>
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
                        <p className="font-semibold text-[10px] leading-tight line-clamp-1 pr-9">{name}</p>
                        <p className="text-[10px] opacity-80">{time}</p>
                        <p className="text-[10px] opacity-70">{s.booked_count}/{s.max_capacity}</p>
                        {!s.is_cancelled && (
                          <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                            <button onClick={() => openEdit(s)}
                              className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40"
                              title="Edit">
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => handleCancel(s.id)}
                              disabled={cancellingId === s.id}
                              className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40"
                              title="Cancel">
                              {cancellingId === s.id
                                ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                : <X className="w-2.5 h-2.5" />
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* Add button */}
                  <button onClick={() => { setEditingId(null); setNewSession(s => ({ ...s, time: '', capacity: 12, instructor_name: 'Enjy Gebril' })); setAddDay(date); setShowAddModal(true) }}
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
      <button onClick={() => { setEditingId(null); setNewSession(s => ({ ...s, time: '', capacity: 12, instructor_name: 'Enjy Gebril' })); setAddDay(new Date()); setShowAddModal(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#006D77] text-white shadow-lg flex items-center justify-center hover:bg-[#004E5C] transition-colors">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-end" onClick={closeModal}>
          <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-28 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{editingId ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
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

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Instructor</label>
              <input type="text" value={newSession.instructor_name}
                placeholder="e.g. Enjy Gebril"
                onChange={e => setNewSession(s => ({ ...s, instructor_name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
            </div>

            <button onClick={editingId ? handleUpdateSession : handleAddSession}
              disabled={saving || !newSession.time || !newSession.class_type_id}
              className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : editingId
                  ? <><Pencil className="w-5 h-5" /> Save Changes</>
                  : <><Plus className="w-5 h-5" /> Add to Schedule</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Copy Last Week Confirmation */}
      {showCopyConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[160] flex items-center justify-center px-6" onClick={() => !copying && setShowCopyConfirm(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">Copy Last Week?</h3>
            <p className="text-sm text-muted-foreground">
              This will copy all classes from the most recent week (with your latest edits) into <span className="font-semibold text-foreground">{weekLabel}</span>. Existing classes won't be duplicated.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCopyConfirm(false)} disabled={copying}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors">
                Cancel
              </button>
              <button onClick={handleCopyLastWeek} disabled={copying}
                className="flex-1 py-3 rounded-xl bg-[#006D77] text-white text-sm font-semibold hover:bg-[#004E5C] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CopyPlus className="w-4 h-4" />}
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="schedule" />
    </main>
  )
}
