'use client'

import { useState } from 'react'

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const classesByDay = {
  Sun: [
    { emoji: '🧘', name: 'Restorative Yoga', time: '9:00 AM', instructor: 'Enjy' },
  ],
  Mon: [
    { emoji: '🧘', name: 'Vinyasa Flow', time: '8:00 AM', instructor: 'Enjy' },
    { emoji: '💪', name: 'Power Fitness', time: '6:00 PM', instructor: 'Enjy' },
  ],
  Tue: [
    { emoji: '🕉️', name: 'Restorative Yoga', time: '5:30 PM', instructor: 'Enjy' },
  ],
  Wed: [
    { emoji: '🧘', name: 'Vinyasa Flow', time: '8:00 AM', instructor: 'Enjy' },
    { emoji: '💪', name: 'Power Fitness', time: '10:30 AM', instructor: 'Enjy' },
  ],
  Thu: [
    { emoji: '🕉️', name: 'Restorative Yoga', time: '5:30 PM', instructor: 'Enjy' },
  ],
  Fri: [
    { emoji: '💪', name: 'Power Fitness', time: '6:00 PM', instructor: 'Enjy' },
  ],
  Sat: [
    { emoji: '🧘', name: 'Vinyasa Flow', time: '10:00 AM', instructor: 'Enjy' },
  ],
}

export function ThisWeekSection() {
  const [selectedDay, setSelectedDay] = useState('Mon')

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3">This Week</h3>
      
      {/* Day pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedDay === day
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-foreground border border-border hover:bg-muted'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Classes for selected day */}
      <div className="space-y-2">
        {classesByDay[selectedDay as keyof typeof classesByDay]?.map((cls, idx) => (
          <div key={idx} className="bg-white border border-border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer">
            <span className="text-2xl">{cls.emoji}</span>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{cls.name}</p>
              <p className="text-xs text-muted-foreground">{cls.time} • {cls.instructor}</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-secondary/30 text-muted-foreground rounded-full">
              Spots avail.
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
