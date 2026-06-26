'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login']
const ADMIN_ONLY_ROUTES = ['/admin', '/select-role']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleSession = async (session: { user: unknown } | null) => {
      if (!session) {
        // No session → go to login (unless already there)
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login')
        }
        setChecking(false)
        return
      }

      // Has session + on login page → go home
      if (PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/')
        setChecking(false)
        return
      }

      // Admin-only routes → verify role
      if (ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
        const user = await getCurrentUser()
        if (!user || user.role !== 'admin') {
          router.replace('/')
          setChecking(false)
          return
        }
      }

      setChecking(false)
    }

    // 1. Initial check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    // 2. Listen for auth state changes (handles login/logout properly)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/login')
          }
        } else if (event === 'SIGNED_IN' && session) {
          if (PUBLIC_ROUTES.includes(pathname)) {
            // Don't redirect here — let the login page handle it
            // to preserve admin → select-role flow
          }
          setChecking(false)
        } else if (event === 'TOKEN_REFRESHED') {
          setChecking(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (checking) {
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
