'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const SKIP  = ['/login', '/select-role']
const ROOTS = ['/', '/admin']

export function BackHandler() {
  const pathname    = usePathname()
  const pathRef     = useRef(pathname)
  const busyRef     = useRef(false)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Keep ref always current — useLayoutEffect runs before paint
  useLayoutEffect(() => { pathRef.current = pathname }, [pathname])

  // Push a trap entry every time pathname changes
  // We use { __trap: true } so we can identify our own states
  useEffect(() => {
    if (SKIP.includes(pathname)) return
    // Avoid pushing duplicate traps
    if (!window.history.state?.__trap) {
      window.history.pushState(
        { __trap: true },
        '',
        window.location.pathname + window.location.search
      )
    }
  }, [pathname])

  // Single persistent listener
  useEffect(() => {
    const handle = (e: PopStateEvent) => {
      if (busyRef.current) return
      const cur = pathRef.current
      if (SKIP.includes(cur)) return

      busyRef.current = true

      // Re-push trap immediately so next back press is also caught
      window.history.pushState(
        { __trap: true },
        '',
        window.location.pathname + window.location.search
      )

      if (ROOTS.includes(cur)) {
        setShowLogout(true)
        busyRef.current = false
      } else {
        // Go home — hard navigation avoids Next.js page-effect interference
        const target = cur.startsWith('/admin') ? '/admin' : '/'
        window.location.replace(target)
        setTimeout(() => { busyRef.current = false }, 600)
      }
    }

    window.addEventListener('popstate', handle)
    return () => window.removeEventListener('popstate', handle)
  }, []) // mount once only

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  if (!showLogout) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center px-5"
      onClick={() => setShowLogout(false)}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-[#E53935]/10 flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-6 h-6 text-[#E53935]" />
        </div>

        <h3 className="text-lg font-bold text-foreground text-center mb-2">
          Log Out?
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Are you sure you want to log out?
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowLogout(false)}
            className="flex-1 py-3.5 border border-border rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
          >
            Stay
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 py-3.5 bg-[#E53935] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-all"
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
