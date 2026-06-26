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
