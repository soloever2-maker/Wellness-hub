'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const SKIP_PAGES = ['/login', '/select-role']
const ROOT_PAGES = ['/', '/admin']

// كل صفحة وأبوها — لو مش موجود يرجع للجذر الأقرب
const PARENT_MAP: Record<string, string> = {
  // ── Client ─────────────────
  '/schedule':      '/',
  '/packages':      '/',
  '/bookings':      '/',
  '/profile':       '/',
  '/my-package':    '/',
  '/notifications': '/',
  '/class':         '/',      // ← مش /schedule لأن غالباً بتيجي من الهوم
  // ── Admin ──────────────────
  '/admin/clients':          '/admin',
  '/admin/attendance':       '/admin',
  '/admin/schedule':         '/admin',
  '/admin/payments':         '/admin',
  '/admin/broadcast':        '/admin',
  '/admin/more':             '/admin',
  '/admin/approvals':        '/admin',
  '/admin/export':           '/admin',
  '/admin/packages-editor':  '/admin',
  '/admin/waitlist':         '/admin',
  '/admin/bookings':         '/admin',
}

function getParent(path: string): string {
  const base = path.split('?')[0]
  if (PARENT_MAP[base]) return PARENT_MAP[base]
  if (base.startsWith('/admin/')) return '/admin'
  return '/'
}

export function BackHandler() {
  const router   = useRouter()
  const pathname = usePathname()

  // useLayoutEffect ← بيحدّث الـ ref قبل ما أي side effect تاني يشتغل
  // عشان نتجنب الـ stale closure في الـ popstate handler
  const pathnameRef = useRef(pathname)
  useLayoutEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // guard عشان ميتنادوش 2 مرة لو الـ back اتضغط بسرعة
  const handlingRef = useRef(false)

  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // ادفع dummy state مع كل تغيير في الصفحة
  useEffect(() => {
    if (SKIP_PAGES.includes(pathname)) return
    window.history.pushState(null, '', window.location.href)
  }, [pathname])

  // listener واحد بس — مش بيتمسح مع كل تغيير
  useEffect(() => {
    const handlePopState = () => {
      // منع double-fire
      if (handlingRef.current) return
      handlingRef.current = true

      const current = pathnameRef.current
      if (SKIP_PAGES.includes(current)) {
        handlingRef.current = false
        return
      }

      // أعد الـ trap فوراً
      window.history.pushState(null, '', window.location.href)

      if (ROOT_PAGES.includes(current)) {
        setShowLogout(true)
        handlingRef.current = false
      } else {
        router.replace(getParent(current))
        // reset الـ guard بعد ما الـ navigation تخلص
        setTimeout(() => { handlingRef.current = false }, 400)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [router])

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
