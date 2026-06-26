'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login']
const ADMIN_ONLY_ROUTES = ['/admin', '/select-role']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  const checkSession = useCallback(async () => {
    // Always start unauthorized until proven otherwise
    setAuthorized(false)

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login')
      } else {
        setAuthorized(true)
      }
      return
    }

    // Has session + on login page → go home
    if (PUBLIC_ROUTES.includes(pathname)) {
      router.replace('/')
      return
    }

    // Admin-only routes → verify role
    if (ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      const user = await getCurrentUser()
      if (!user || user.role !== 'admin') {
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
          setAuthorized(false)
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/login')
          }
        } else if (event === 'SIGNED_IN' && session) {
          if (!PUBLIC_ROUTES.includes(pathname)) {
            setAuthorized(true)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          setAuthorized(true)
        }
      }
    )

    // 3. Handle back/forward button (popstate) — re-check session
    const handlePopState = () => { checkSession() }

    // 4. Handle page restored from bfcache (back button on mobile)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) { checkSession() }
    }

    // 5. Handle visibility change (tab switch / app resume)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') { checkSession() }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [pathname, router, checkSession])

  // NEVER show children until authorized
  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
