'use client'

import { useState } from 'react'
import { ArrowLeft, UserPlus, Clock } from 'lucide-react'
import Link from 'next/link'

interface WaitlistEntry {
  id: string
  client: string
  phone: string
  joinedAt: string
  status: 'waiting' | 'notified' | 'booked'
}

interface ClassWaitlist {
  id: string
  name: string
  time: string
  date: string
  waitlist: WaitlistEntry[]
}

const classesWithWaitlist: ClassWaitlist[] = [
  {
    id: '1',
    name: 'Mat Pilates',
    time: '5:00 PM',
    date: 'Monday, June 29',
    waitlist: [
      { id: 'w1', client: 'Layla Hassan', phone: '+20 10 1234 5678', joinedAt: '2 hours ago', status: 'waiting' },
      { id: 'w2', client: 'Rana Samir', phone: '+20 10 9876 5432', joinedAt: '45 min ago', status: 'waiting' },
    ],
  },
  {
    id: '2',
    name: 'Power Yoga',
    time: '11:00 AM',
    date: 'Sunday, June 28',
    waitlist: [
      { id: 'w3', client: 'Dina Mostafa', phone: '+20 10 5555 1234', joinedAt: '3 hours ago', status: 'notified' },
      { id: 'w4', client: 'Hana Ali', phone: '+20 10 7777 8888', joinedAt: '1 hour ago', status: 'waiting' },
      { id: 'w5', client: 'Farida Nabil', phone: '+20 10 3333 4444', joinedAt: '30 min ago', status: 'waiting' },
    ],
  },
]

export default function AdminWaitlistPage() {
  const [classes] = useState(classesWithWaitlist)

  const statusStyles = {
    waiting: 'bg-[#FF9800]/10 text-[#FF9800]',
    notified: 'bg-[#D63384]/10 text-[#D63384]',
    booked: 'bg-[#4CAF50]/10 text-[#4CAF50]',
  }

  const statusLabels = {
    waiting: 'Waiting',
    notified: 'Notified',
    booked: 'Booked',
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Waitlist</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {classes.map((cls) => (
          <div key={cls.id}>
            {/* Class Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{cls.name}</h3>
                <p className="text-xs text-muted-foreground">{cls.date} at {cls.time}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F8BBD0]/30 text-[#D63384]">
                {cls.waitlist.length} waiting
              </span>
            </div>

            {/* Waitlist Entries */}
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              {cls.waitlist.map((entry, i) => (
                <div key={entry.id} className={`px-4 py-3.5 ${i < cls.waitlist.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{entry.client}</p>
                      <p className="text-xs text-muted-foreground">{entry.phone}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[entry.status]}`}>
                      {statusLabels[entry.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Joined {entry.joinedAt}
                    </div>
                    {entry.status === 'waiting' && (
                      <button className="flex items-center gap-1 text-xs font-medium text-[#D63384] hover:text-[#AD1457] transition-colors">
                        <UserPlus className="w-3.5 h-3.5" />
                        Promote to Booked
                      </button>
                    )}
                    {entry.status === 'notified' && (
                      <span className="text-xs text-muted-foreground italic">Waiting for response (1hr)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty state hint */}
        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active waitlists</p>
          </div>
        )}
      </div>
    </main>
  )
}
