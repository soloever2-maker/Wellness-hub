'use client'

import { useEffect, useState } from 'react'
import { UserMenu } from './user-menu'
import { getCurrentUser } from '@/lib/auth'

export function TopBar() {
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user?.full_name) {
        setFirstName(user.full_name.split(' ')[0])
      }
    })
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="bg-background px-4 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-border/50">
      <div>
        <p className="text-xs text-muted-foreground">{greeting}</p>
        <h1 className="text-lg font-bold text-foreground">{firstName || 'Welcome'} 👋</h1>
      </div>
      <UserMenu variant="client" />
    </div>
  )
}
