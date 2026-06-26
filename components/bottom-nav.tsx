'use client'

import Link from 'next/link'
import { Home, Calendar, BookOpen, User, Package } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Home', id: 'home', href: '/' },
  { icon: Calendar, label: 'Schedule', id: 'schedule', href: '/schedule' },
  { icon: Package, label: 'Packages', id: 'packages', href: '/packages' },
  { icon: BookOpen, label: 'Bookings', id: 'bookings', href: '/bookings' },
  { icon: User, label: 'Profile', id: 'profile', href: '/profile' },
]

interface BottomNavProps {
  activePage?: 'home' | 'schedule' | 'packages' | 'bookings' | 'profile'
}

export function BottomNav({ activePage = 'home' }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all ${
                isActive ? 'text-[#006D77]' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label}</span>
              {isActive && <span className="w-4 h-0.5 rounded-full bg-[#006D77] mt-0.5" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
