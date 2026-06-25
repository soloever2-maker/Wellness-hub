'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const scheduleData: Record<string, { name: string; time: string; color: string }[]> = {
  Sat: [{ name: 'Gentle Yoga', time: '9:00', color: 'bg-[#F8BBD0]' }],
  Sun: [
    { name: 'Power Yoga', time: '11:00', color: 'bg-[#D63384]' },
    { name: 'Gentle Yoga', time: '7:30', color: 'bg-[#F8BBD0]' },
  ],
  Mon: [
    { name: 'Mat Pilates', time: '7:30', color: 'bg-[#7B2D8E]' },
    { name: 'Belly Dancing', time: '8:20', color: 'bg-[#D63384]' },
  ],
  Tue: [{ name: 'Aqua Aerobics', time: '6:00', color: 'bg-[#7B2D8E]' }],
  Wed: [{ name: 'Gentle Yoga', time: '8:00', color: 'bg-[#F8BBD0]' }],
  Thu: [{ name: 'Power Yoga', time: '11:00', color: 'bg-[#D63384]' }],
  Fri: [],
}

const classTypes = ['Power Yoga', 'Mat Pilates', 'Gentle Yoga', 'Belly Rhythmic Dancing', 'Aqua Aerobics']
const durations = [45, 60, 75, 90]

export default function AdminSchedulePage() {
  const [showModal, setShowModal] = useState(false)
  const [newClass, setNewClass] = useState({
    type: classTypes[0],
    date: '',
    time: '',
    duration: 60,
    capacity: 12,
    recurring: false,
  })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Manage Schedule</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground px-2">July 5 – 11</span>
            <button className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="px-2 pt-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
          ))}

          {/* Class Blocks */}
          {weekDays.map((day) => (
            <div key={`blocks-${day}`} className="min-h-[120px] bg-white border border-border rounded-xl p-1 space-y-1">
              {(scheduleData[day] || []).map((cls, i) => (
                <button
                  key={i}
                  className={`w-full ${cls.color} rounded-lg px-1.5 py-2 text-left ${
                    cls.color === 'bg-[#F8BBD0]' ? 'text-[#2D1B2E]' : 'text-white'
                  }`}
                >
                  <p className="text-[10px] font-bold leading-tight truncate">{cls.name}</p>
                  <p className="text-[9px] opacity-80">{cls.time}</p>
                </button>
              ))}
              <button
                onClick={() => setShowModal(true)}
                className="w-full border border-dashed border-border rounded-lg py-2 flex items-center justify-center hover:border-[#D63384]/40 hover:bg-[#D63384]/5 transition-colors"
              >
                <Plus className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-[#D63384] to-[#7B2D8E] rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-20"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Class Session</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Class Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Class Type</label>
                <select
                  value={newClass.type}
                  onChange={(e) => setNewClass(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D63384]/30"
                >
                  {classTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={newClass.date}
                  onChange={(e) => setNewClass(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D63384]/30"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Start Time</label>
                <input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D63384]/30"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Duration</label>
                <div className="flex gap-2">
                  {durations.map((d) => (
                    <button
                      key={d}
                      onClick={() => setNewClass(p => ({ ...p, duration: d }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        newClass.duration === d
                          ? 'bg-[#D63384] text-white'
                          : 'bg-white border border-border text-foreground'
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Max Capacity</label>
                <input
                  type="number"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass(p => ({ ...p, capacity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D63384]/30"
                />
              </div>

              {/* Recurring */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-foreground">Recurring Weekly</span>
                <button
                  onClick={() => setNewClass(p => ({ ...p, recurring: !p.recurring }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${newClass.recurring ? 'bg-[#D63384]' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${newClass.recurring ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-gradient-to-r from-[#D63384] to-[#7B2D8E] text-white font-semibold rounded-xl mt-4"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="schedule" />
    </main>
  )
}
