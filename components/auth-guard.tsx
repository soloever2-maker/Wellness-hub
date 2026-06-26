'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession, getCurrentUser } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login']
const ADMIN_ONLY_ROUTES = ['/admin', '/select-role']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const session = await getSession()

      // No session → go to login
      if (!session) {
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login')
        }
        setChecking(false)
        return
      }

      // Has session + on login → go to home
      if (PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/')
        setChecking(false)
        return
      }

      // Admin-only routes → check role
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

    check()
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
