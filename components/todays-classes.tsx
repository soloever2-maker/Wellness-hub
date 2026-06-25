'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const todaysClasses = [
  { id: 1, emoji: '🧘', name: 'Vinyasa Flow', time: '8:00 AM', spots: 3 },
  { id: 2, emoji: '💪', name: 'Power Fitness', time: '10:30 AM', spots: 6 },
  { id: 3, emoji: '🕉️', name: 'Restorative Yoga', time: '5:30 PM', spots: 8 },
]

export function TodaysClasses() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">Today&apos;s Classes</h3>
        <Link href="/schedule" className="text-sm font-medium text-[#D63384]">See All →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {todaysClasses.map((cls) => (
          <Link
            key={cls.id}
            href="/class"
            className="flex-shrink-0 bg-white border border-border rounded-2xl p-4 w-40 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">{cls.emoji}</div>
            <h4 className="font-semibold text-foreground text-sm mb-1">{cls.name}</h4>
            <p className="text-xs text-muted-foreground mb-3">{cls.time}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-1 bg-secondary/30 text-muted-foreground rounded-full">
                {cls.spots} spots
              </span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
