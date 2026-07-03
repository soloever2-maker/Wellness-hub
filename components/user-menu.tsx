'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, LayoutDashboard, Smartphone, User as UserIcon, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { logoutUser, getCurrentUser } from '@/lib/auth'
import type { AppUser } from '@/lib/supabase'

interface UserMenuProps {
  variant?: 'client' | 'admin'
  showNotifications?: boolean
}

export function UserMenu({ variant = 'client', showNotifications = true }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  // Read unread counter from localStorage + listen for updates
  useEffect(() => {
    const readCount = () => {
      const n = parseInt(localStorage.getItem('notifs_unread') || '0')
      setUnreadCount(n)
    }
    readCount()
    window.addEventListener('notifs_updated', readCount)
    return () => window.removeEventListener('notifs_updated', readCount)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutUser()
      router.replace('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const isAdmin = user?.role === 'admin'

  return (
    <div className="flex items-center gap-2">
      {showNotifications && variant !== 'admin' && (
        <Link
          href="/notifications"
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors relative"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#B8612A] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Link>
      )}

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 bg-white border border-border rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center">
            <span className="text-xs font-bold text-[#006D77]">{initials}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-bold text-foreground truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B8612A]/10 text-[#B8612A] uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>

            {/* Admin: Switch View */}
            {isAdmin && (
              <>
                {variant === 'client' && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#006D77]/5 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#006D77]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Switch to Admin Panel</p>
                      <p className="text-[10px] text-muted-foreground">Manage your studio</p>
                    </div>
                  </Link>
                )}
                {variant === 'admin' && (
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#006D77]/5 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-[#006D77]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Switch to Client App</p>
                      <p className="text-[10px] text-muted-foreground">View as a member</p>
                    </div>
                  </Link>
                )}
                <div className="h-px bg-border" />
              </>
            )}

            {/* Profile (only client view) */}
            {variant === 'client' && (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">My Profile</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
            >
              {loggingOut ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-red-500">
                {loggingOut ? 'Signing out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
