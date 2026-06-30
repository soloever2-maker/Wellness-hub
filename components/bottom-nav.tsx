// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   components/bottom-nav.tsx
// (بقى يقبل activePage — صلّح 5 من الـ 6 errors)
// ============================================================

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Compass, BookOpen, User } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home,     label: 'Home',     id: 'home',     href: '/'         },
  { icon: Calendar, label: 'Schedule', id: 'schedule', href: '/schedule' },
  { icon: Compass,  label: 'Explore',  id: 'explore',  href: '/explore'  },
  { icon: BookOpen, label: 'Bookings', id: 'bookings', href: '/bookings' },
  { icon: User,     label: 'Profile',  id: 'profile',  href: '/profile'  },
]

export function BottomNav({ activePage }: { activePage?: string } = {}) {
  const pathname = usePathname()
  const router   = useRouter()

  const activeId = activePage ?? (NAV_ITEMS.find(item =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )?.id ?? 'home')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 pb-safe max-w-lg mx-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, id, href }) => {
          const isActive = activeId === id
          return (
            <button
              key={id}
              onClick={() => {
                // replace بدل push — بيمنع تراكم الـ back stack
                if (!isActive) router.replace(href)
              }}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? 'text-[#006D77]'
                  : 'text-muted-foreground hover:text-foreground'
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
