'use client'

import { useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, CheckSquare, Users, MoreHorizontal } from 'lucide-react'

type ActivePage = 'dashboard' | 'schedule' | 'attendance' | 'clients' | 'more'

const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; id: ActivePage; href: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard',  id: 'dashboard',  href: '/admin'            },
  { icon: Calendar,        label: 'Schedule',   id: 'schedule',   href: '/admin/schedule'   },
  { icon: CheckSquare,     label: 'Attendance', id: 'attendance', href: '/admin/attendance' },
  { icon: Users,           label: 'Clients',    id: 'clients',    href: '/admin/clients'    },
  { icon: MoreHorizontal,  label: 'More',       id: 'more',       href: '/admin/more'       },
]

export function AdminBottomNav({ activePage }: { activePage: ActivePage }) {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 pb-safe max-w-lg mx-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, id, href }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              onClick={() => {
                // replace بدل push — بيمنع تراكم الـ back stack
                if (!isActive) router.replace(href)
              }}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive ? 'text-[#006D77]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#006D77] -mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
