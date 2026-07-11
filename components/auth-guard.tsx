'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login']
const OPEN_ROUTES = ['/privacy']   // viewable with or without a session
const ADMIN_ONLY_ROUTES = ['/admin', '/select-role']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  // Session-scoped approval cache: the DB is asked ONCE per session,
  // not on every navigation. This keeps the strict approval gate
  // without the per-page network round-trip that made the app sluggish.
  const approvalCache = useRef<{ authId: string; role: string } | null>(null)

  const checkSession = useCallback(async () => {
    // Open routes (e.g. privacy policy) render for everyone
    if (OPEN_ROUTES.includes(pathname)) {
      setAuthorized(true)
      return
    }

    // getSession() is local (no network) — instant
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      approvalCache.current = null
      if (!PUBLIC_ROUTES.includes(pathname)) {
        setAuthorized(false)
        router.replace('/login')
      } else {
        setAuthorized(true)
      }
      return
    }

    // ⛔ APPROVAL GATE: a session alone is NOT enough — but we only
    // ask the database ONCE per session, then trust the cache.
    let cached = approvalCache.current
    if (!cached || cached.authId !== session.user.id) {
      // Only now do we block the UI while verifying
      setAuthorized(false)
      const user = await getCurrentUser()
      if (!user || user.status !== 'approved') {
        approvalCache.current = null
        await supabase.auth.signOut()
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login?pending=1')
        } else {
          setAuthorized(true)
        }
        return
      }
      cached = { authId: session.user.id, role: user.role }
      approvalCache.current = cached
    }

    // Approved + on login page → admins pick a view, clients go home
    if (PUBLIC_ROUTES.includes(pathname)) {
      router.replace(cached.role === 'admin' ? '/select-role' : '/')
      return
    }

    // Admin-only routes → verify role (from cache — instant, no flash)
    if (ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      if (cached.role !== 'admin') {
        router.replace('/')
        return
      }
    }

    setAuthorized(true)
  }, [pathname, router])

  useEffect(() => {
    // 1. Initial check
    checkSession()

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          approvalCache.current = null
          if (OPEN_ROUTES.includes(pathname)) return
          if (PUBLIC_ROUTES.includes(pathname)) {
            // Stay on login page and keep it visible
            setAuthorized(true)
          } else {
            setAuthorized(false)
            router.replace('/login')
          }
        } else if (event === 'SIGNED_IN' && session) {
          // On the login page, the page itself handles the redirect
          // (splash screen → select-role for admins). Don't race it.
          if (PUBLIC_ROUTES.includes(pathname)) return
          // Elsewhere: full check (profile + approval) — never blind-authorize
          checkSession()
        } else if (event === 'TOKEN_REFRESHED') {
          setAuthorized(true)
        }
      }
    )

    // 3. Handle page restored from bfcache (back button on mobile)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) { checkSession() }
    }

    // 4. Handle visibility change (tab switch / app resume)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') { checkSession() }
    }

    // NOTE: popstate is handled by BackHandler — no listener here
    // to avoid race-condition (setAuthorized(false) flash + double nav)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [pathname, router, checkSession])

  // NEVER show children until authorized — same look as app/loading.tsx
  if (!authorized) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #F5F1E6 0%, #E0EEF0 50%, #EDD7C9 100%)' }}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="animate-pulse" style={{ mixBlendMode: 'multiply', animationDuration: '2s' }}>
            <Image src="/icon.png" alt="" width={100} height={100} className="object-contain" priority />
          </div>
          <div className="w-32 h-1 bg-[#006D77]/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#006D77] to-[#B8612A] rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
