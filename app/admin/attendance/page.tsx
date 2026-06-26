'use client'

import { useState } from 'react'
import { Check, X, Clock, ChevronDown } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

const todayClasses = [
  { id: 1, name: 'Power Yoga', time: '11:00 AM', booked: 8 },
  { id: 2, name: 'Mat Pilates', time: '5:00 PM', booked: 6 },
  { id: 3, name: 'Gentle Yoga', time: '7:30 PM', booked: 4 },
]

const initialClients = [
  { id: 1, name: 'Sarah Ahmed', phone: '+20 101 234 5678', package: '8 Classes', remaining: 5 },
  { id: 2, name: 'Nour Hassan', phone: '+20 102 345 6789', package: '4 Classes', remaining: 2 },
  { id: 3, name: 'Layla Mohamed', phone: '+20 103 456 7890', package: '12 Classes', remaining: 9 },
  { id: 4, name: 'Mona Ali', phone: '+20 104 567 8901', package: '8 Classes', remaining: 3 },
  { id: 5, name: 'Yasmin Khaled', phone: '+20 105 678 9012', package: '4 Classes', remaining: 1 },
  { id: 6, name: 'Dina Samir', phone: '+20 106 789 0123', package: '8 Classes', remaining: 7 },
  { id: 7, name: 'Hana Tarek', phone: '+20 107 890 1234', package: '12 Classes', remaining: 11 },
  { id: 8, name: 'Rana Fathy', phone: '+20 108 901 2345', package: '4 Classes', remaining: 4 },
]

const waitlist = [
  { id: 9, name: 'Fatma Ibrahim', phone: '+20 109 012 3456' },
  { id: 10, name: 'Salma Adel', phone: '+20 110 123 4567' },
]

type Status = 'pending' | 'attended' | 'no_show'

export default function AdminAttendancePage() {
  const [selectedClass, setSelectedClass] = useState(todayClasses[0])
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(initialClients.map(c => [c.id, 'pending' as Status]))
  )
  const [showWaitlist, setShowWaitlist] = useState(false)

  const setStatus = (clientId: number, status: Status) => {
    setStatuses(prev => ({ ...prev, [clientId]: status }))
  }

  const counts = {
    attended: Object.values(statuses).filter(s => s === 'attended').length,
    no_show: Object.values(statuses).filter(s => s === 'no_show').length,
    pending: Object.values(statuses).filter(s => s === 'pending').length,
  }

  return (
    <main className="bg-background min-h-screen pb-40">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">June 25, 2026</p>
      </div>

      {/* Class Selector */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {todayClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedClass.id === cls.id
                  ? 'bg-[#006D77] text-white shadow-md'
                  : 'bg-white border border-border text-foreground hover:border-[#006D77]/30'
              }`}
            >
              {cls.name} — {cls.time} ({cls.booked})
            </button>
          ))}
        </div>
      </div>

      {/* Attendance List */}
      <div className="px-4 space-y-2">
        {initialClients.map((client) => (
          <div key={client.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{client.name}</h4>
                <p className="text-xs text-muted-foreground">{client.phone}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-secondary/40 text-muted-foreground rounded-full">
                {client.package} ({client.remaining} left)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatus(client.id, 'attended')}
                className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
                  statuses[client.id] === 'attended'
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#4CAF50]/5 text-[#4CAF50] border border-[#4CAF50]/20'
                }`}
              >
                <Check className="w-4 h-4" /> Attended
              </button>
              <button
                onClick={() => setStatus(client.id, 'no_show')}
                className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
                  statuses[client.id] === 'no_show'
                    ? 'bg-[#E53935] text-white'
                    : 'bg-[#E53935]/5 text-[#E53935] border border-[#E53935]/20'
                }`}
              >
                <X className="w-4 h-4" /> No Show
              </button>
              <button
                onClick={() => setStatus(client.id, 'pending')}
                className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
                  statuses[client.id] === 'pending'
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" /> Pending
              </button>
            </div>
          </div>
        ))}

        {/* Waitlist */}
        <button
          onClick={() => setShowWaitlist(!showWaitlist)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-border rounded-2xl mt-4"
        >
          <span className="text-sm font-semibold text-foreground">Waitlist ({waitlist.length})</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showWaitlist ? 'rotate-180' : ''}`} />
        </button>
        {showWaitlist && (
          <div className="space-y-2">
            {waitlist.map((client) => (
              <div key={client.id} className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{client.name}</h4>
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                </div>
                <button className="text-xs font-medium px-3 py-1.5 bg-[#006D77] text-white rounded-full">
                  Promote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-[#4CAF50] font-medium">Attended: {counts.attended}</span>
          <span className="text-[#E53935] font-medium">No Show: {counts.no_show}</span>
          <span className="text-gray-400 font-medium">Pending: {counts.pending}</span>
        </div>
        <button className="w-full py-3 bg-gradient-to-r from-[#006D77] to-[#E86500] text-white font-semibold rounded-xl">
          Save Attendance
        </button>
      </div>

      <AdminBottomNav activePage="attendance" />
    </main>
  )
}
