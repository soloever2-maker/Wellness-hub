'use client'

import { useState } from 'react'
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

const weekDates = [
  { day: 'Sun', date: 6, isToday: true },
  { day: 'Mon', date: 7, isToday: false },
  { day: 'Tue', date: 8, isToday: false },
  { day: 'Wed', date: 9, isToday: false },
  { day: 'Thu', date: 10, isToday: false },
  { day: 'Fri', date: 11, isToday: false },
  { day: 'Sat', date: 12, isToday: false },
]

const classTypes = ['All', 'Yoga', 'Pilates', 'Dance', 'Aerobics']

const classesData: Record<number, { id: number; name: string; emoji: string; type: string; startTime: string; endTime: string; instructor: string; spotsLeft: number | null }[]> = {
  6: [
    { id: 1, name: 'Power Yoga', emoji: '🧘‍♀️', type: 'Yoga', startTime: '11:00 AM', endTime: '12:00 PM', instructor: 'Enjy Gebril', spotsLeft: 4 },
    { id: 2, name: 'Mat Pilates', emoji: '🤸‍♀️', type: 'Pilates', startTime: '5:00 PM', endTime: '6:00 PM', instructor: 'Enjy Gebril', spotsLeft: null },
    { id: 3, name: 'Gentle Yoga', emoji: '🌿', type: 'Yoga', startTime: '7:30 PM', endTime: '8:30 PM', instructor: 'Enjy Gebril', spotsLeft: 6 },
  ],
  7: [
    { id: 4, name: 'Belly Rhythmic Dancing', emoji: '💃', type: 'Dance', startTime: '8:20 PM', endTime: '9:20 PM', instructor: 'Enjy Gebril', spotsLeft: 8 },
    { id: 5, name: 'Aqua Aerobics', emoji: '🏊‍♀️', type: 'Aerobics', startTime: '6:00 PM', endTime: '7:00 PM', instructor: 'Enjy Gebril', spotsLeft: 2 },
  ],
  8: [],
  9: [{ id: 6, name: 'Power Yoga', emoji: '🧘‍♀️', type: 'Yoga', startTime: '11:00 AM', endTime: '12:00 PM', instructor: 'Enjy Gebril', spotsLeft: 10 }],
  10: [{ id: 7, name: 'Mat Pilates', emoji: '🤸‍♀️', type: 'Pilates', startTime: '7:30 PM', endTime: '8:30 PM', instructor: 'Enjy Gebril', spotsLeft: 5 }],
  11: [],
  12: [{ id: 8, name: 'Gentle Yoga & Recovery', emoji: '🌿', type: 'Yoga', startTime: '9:00 AM', endTime: '10:00 AM', instructor: 'Enjy Gebril', spotsLeft: 12 }],
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(6)
  const [selectedType, setSelectedType] = useState('All')
  const [showFilter, setShowFilter] = useState(false)

  const allClasses = classesData[selectedDate] || []
  const classes = selectedType === 'All' ? allClasses : allClasses.filter(c => c.type === selectedType)

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Class Schedule</h1>
        <button onClick={() => setShowFilter(!showFilter)}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${showFilter ? 'bg-[#D63384] border-[#D63384]' : 'bg-white border-border'}`}>
          {showFilter ? <X className="w-5 h-5 text-white" /> : <SlidersHorizontal className="w-5 h-5 text-foreground" />}
        </button>
      </div>

      {showFilter && (
        <div className="px-4 py-3 bg-white border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Filter by class type</p>
          <div className="flex gap-2 flex-wrap">
            {classTypes.map((type) => (
              <button key={type} onClick={() => { setSelectedType(type); setShowFilter(false) }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedType === type ? 'bg-[#D63384] text-white' : 'bg-background border border-border text-foreground hover:bg-[#F8BBD0]/20'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedType !== 'All' && (
        <div className="px-4 pt-3">
          <button onClick={() => setSelectedType('All')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8BBD0]/30 text-[#D63384] rounded-full text-xs font-medium">
            {selectedType} <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {weekDates.map((d) => (
            <button key={d.date} onClick={() => setSelectedDate(d.date)}
              className={`flex flex-col items-center gap-1 min-w-[48px] py-3 px-2 rounded-2xl transition-all ${selectedDate === d.date ? 'bg-[#D63384] text-white shadow-md' : 'bg-white border border-border text-foreground hover:border-[#D63384]/30'}`}>
              <span className="text-xs font-medium">{d.day}</span>
              <span className="text-lg font-bold">{d.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🧘‍♀️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{selectedType !== 'All' ? `No ${selectedType} classes today` : 'No classes today'}</h3>
            <p className="text-sm text-muted-foreground">Check another day for available classes</p>
          </div>
        ) : (
          classes.map((cls) => (
            <Link href="/class" key={cls.id}>
              <div className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-bold text-foreground">{cls.startTime}</p>
                  <p className="text-xs text-muted-foreground">{cls.endTime}</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{cls.emoji}</span>
                    <h4 className="font-semibold text-foreground">{cls.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-secondary/40 text-muted-foreground rounded-full">{cls.type}</span>
                    <span className="text-xs text-muted-foreground">{cls.instructor}</span>
                  </div>
                </div>
                <div>
                  {cls.spotsLeft === null
                    ? <span className="text-xs font-medium px-3 py-1.5 bg-[#FF9800]/10 text-[#FF9800] rounded-full">Full</span>
                    : <span className="text-xs font-medium px-3 py-1.5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full">{cls.spotsLeft} left</span>
                  }
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav activePage="schedule" />
    </main>
  )
}
