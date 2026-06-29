'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserMenu } from './user-menu'
import { getCurrentUser } from '@/lib/auth'

export function TopBar() {
  const [firstName, setFirstName] = useState('')
  const [avatarUrl, setAvatarUrl]  = useState('')

  useEffect(() => {
    getCurrentUser().then(user => {
      if (!user) return
      if (user.full_name) setFirstName(user.full_name.split(' ')[0])
      if ((user as any).avatar_url) setAvatarUrl((user as any).avatar_url)
    })
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const initials = firstName.slice(0, 1).toUpperCase()

  return (
    <div className="bg-background px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-border/40">

      {/* Left: Avatar + Greeting */}
      <div className="flex items-center gap-3">
        {/* Avatar — taps to profile */}
        <Link href="/profile">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-[#006D77]/15 shadow-sm active:scale-95 transition-transform">
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #006D77, #E86500)' }}>
                <span className="text-white font-bold text-base">{initials || '🧘'}</span>
              </div>
            )}
          </div>
        </Link>

        {/* Text */}
        <div>
          <p className="text-[11px] text-muted-foreground leading-none">{greeting}</p>
          <h1 className="text-base font-bold text-foreground mt-0.5 leading-tight">
            {firstName || 'Welcome'} 👋
          </h1>
        </div>
      </div>

      {/* Right: Notification + Menu */}
      <UserMenu variant="client" />
    </div>
  )
}
