'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const SKIP_PAGES = ['/login', '/select-role']
const ROOT_PAGES = ['/', '/admin']

const PARENT_MAP: Record<string, string> = {
  // ── Client ─────────────────────
  '/schedule':      '/',
  '/packages':      '/',
  '/bookings':      '/',
  '/profile':       '/',
  '/my-package':    '/',
  '/notifications': '/',
  '/class':         '/schedule',
  // ── Admin ──────────────────────
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

function getParent(path: string): string {
  const base = path.split('?')[0]
  if (PARENT_MAP[base]) return PARENT_MAP[base]
  if (base.startsWith('/admin/')) return '/admin'
  return '/'
}

export function BackHandler() {
  const router      = useRouter()
  const pathname    = usePathname()

  // ← ref عشان الـ listener يشوف دايماً الـ pathname الحالي
  // من غير ما نحتاج نمسحه ونضيفه مع كل تغيير
  const pathnameRef = useRef(pathname)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // نحدّث الـ ref كل ما الـ pathname يتغير
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // ندفع dummy state كل ما الصفحة تتغير
  useEffect(() => {
    if (SKIP_PAGES.includes(pathname)) return
    window.history.pushState(null, '')
  }, [pathname])

  // ← الـ listener بيتسجل مرة واحدة بس عند mount
  // وبيفضل شغّال على طول بدون ما يتمسح ويتضاف تاني
  useEffect(() => {
    const handlePopState = () => {
      const current = pathnameRef.current

      // صفحة login → مش بنتدخل
      if (SKIP_PAGES.includes(current)) return

      // نعيد الـ trap فوراً
      window.history.pushState(null, '')

      if (ROOT_PAGES.includes(current)) {
        // على الجذر → logout dialog
        setShowLogout(true)
      } else {
        // روح الأب
        router.replace(getParent(current))
      }
    }

    window.addEventListener('popstate', handlePopState)
    // بيتمسح بس لما الـ component يتشال من الـ DOM كلياً (مش مع كل pathname change)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router]) // ← مش فيه pathname هنا عشان كده

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
