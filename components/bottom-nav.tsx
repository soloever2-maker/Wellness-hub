'use client'

import { useState } from 'react'
import { Home, Calendar, Plus, BookOpen, User } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Home', id: 'home' },
  { icon: Calendar, label: 'Schedule', id: 'schedule' },
  { icon: Plus, label: 'Book', id: 'book' },
  { icon: BookOpen, label: 'Bookings', id: 'bookings' },
  { icon: User, label: 'Profile', id: 'profile' },
]

interface BottomNavProps {
  activePage?: 'home' | 'schedule' | 'book' | 'bookings' | 'profile'
}

export function BottomNav({ activePage = 'home' }: BottomNavProps) {
  const [active, setActive] = useState(activePage)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#D63384]/20 to-[#7B2D8E]/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
