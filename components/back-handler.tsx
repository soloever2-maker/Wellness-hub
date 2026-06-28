'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// صفحات الـ back handler مش بيتدخل فيها
const SKIP_PAGES = ['/login', '/select-role']

// الصفحات الجذر — باك منهم = logout dialog
const ROOT_PAGES = ['/', '/admin']

// خريطة كل صفحة وأبوها
const PARENT_MAP: Record<string, string> = {
  // ── Client pages ──────────────────────────
  '/schedule':      '/',
  '/packages':      '/',
  '/bookings':      '/',
  '/profile':       '/',
  '/my-package':    '/',
  '/notifications': '/',
  '/class':         '/schedule',   // /class?id=xxx → schedule → home

  // ── Admin pages ───────────────────────────
  '/admin/clients':         '/admin',
  '/admin/attendance':      '/admin',
  '/admin/schedule':        '/admin',
  '/admin/payments':        '/admin',
  '/admin/broadcast':       '/admin',
  '/admin/more':            '/admin',
  '/admin/approvals':       '/admin',
  '/admin/export':          '/admin',
  '/admin/packages-editor': '/admin',
  '/admin/waitlist':        '/admin',
  '/admin/bookings':        '/admin',
}

function getParent(pathname: string): string {
  // إزالة الـ query string عشان نطابق صح
  const base = pathname.split('?')[0]

  // لو موجود في الـ map يرجع أبوه
  if (PARENT_MAP[base]) return PARENT_MAP[base]

  // fallback: أي صفحة أدمن مش في الـ map → admin home
  if (base.startsWith('/admin/')) return '/admin'

  // أي صفحة تانية → client home
  return '/'
}

export function BackHandler() {
  const router   = useRouter()
  const pathname = usePathname()
  const [showLogout,  setShowLogout]  = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  useEffect(() => {
    if (SKIP_PAGES.includes(pathname)) return

    // ندفع entry وهمية عشان زرار الـ back يلاقي حاجة يـ"يرجع" منها
    window.history.pushState({ backHandled: true }, '')

    const handlePopState = () => {
      // نعيد الـ trap فوراً
      window.history.pushState({ backHandled: true }, '')

      if (ROOT_PAGES.includes(pathname)) {
        // على الجذر → اسأل logout
        setShowLogout(true)
      } else {
        // روح الأب
        router.replace(getParent(pathname))
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [pathname, router])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    setShowLogout(false)
    setLoggingOut(false)
    router.replace('/login')
  }

  if (!showLogout) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center px-4"
      onClick={() => setShowLogout(false)}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-[#E53935]/10 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-6 h-6 text-[#E53935]" />
        </div>

        <h3 className="text-lg font-bold text-foreground text-center mb-2">Log Out?</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Are you sure you want to log out of Align with Enjy?
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowLogout(false)}
            className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-foreground"
          >
            Stay
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 py-3 bg-[#E53935] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loggingOut
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <LogOut className="w-4 h-4" />
            }
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
