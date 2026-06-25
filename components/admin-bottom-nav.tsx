'use client'

import Link from 'next/link'
import { LayoutDashboard, Calendar, ClipboardCheck, Users, MoreHorizontal } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', href: '/admin' },
  { icon: Calendar, label: 'Schedule', id: 'schedule', href: '/admin/schedule' },
  { icon: ClipboardCheck, label: 'Attendance', id: 'attendance', href: '/admin/attendance' },
  { icon: Users, label: 'Clients', id: 'clients', href: '/admin/clients' },
  { icon: MoreHorizontal, label: 'More', id: 'more', href: '/admin/more' },
]

interface AdminBottomNavProps {
  activePage?: 'dashboard' | 'schedule' | 'attendance' | 'clients' | 'more'
}

export function AdminBottomNav({ activePage = 'dashboard' }: AdminBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#D63384]/20 to-[#7B2D8E]/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
