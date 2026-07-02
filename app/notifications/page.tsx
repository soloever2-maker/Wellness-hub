'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Bell, CheckCircle, Clock, Calendar, Package } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type Notification = {
  id: string
  type: string
  message: string
  status: string
  sent_at: string
  created_at: string
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  reminder_24h:  { icon: Clock,         color: 'text-[#006D77]', bg: 'bg-[#E0EEF0]',      label: '24h Reminder' },
  reminder_2h:   { icon: Clock,         color: 'text-[#B8612A]', bg: 'bg-[#EDD7C9]/40',   label: '2h Reminder' },
  broadcast:     { icon: Bell,          color: 'text-[#006D77]', bg: 'bg-[#E0EEF0]',      label: 'Message from Enjy' },
  booking:       { icon: CheckCircle,   color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10',   label: 'Booking' },
  package:           { icon: Package,  color: 'text-[#B8612A]', bg: 'bg-[#EDD7C9]/40', label: 'Package' },
  package_activated: { icon: Package,  color: 'text-[#B8612A]', bg: 'bg-[#EDD7C9]/40', label: '🎉 Package Activated' },
  class_reminder:    { icon: Calendar, color: 'text-[#006D77]', bg: 'bg-[#E0EEF0]',    label: 'Class Reminder' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'Just now'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifs = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('notification_log')
        .select('id, type, message, status, sent_at, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setNotifications(data as Notification[])
      setLoading(false)

      // Mark all as read
      localStorage.setItem('notifs_unread', '0')
      window.dispatchEvent(new Event('notifs_updated'))
    }
    fetchNotifs()
  }, [])

  return (
    <main className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Class reminders and messages from Enjy will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.broadcast
              const Icon = cfg.icon
              const date = n.sent_at || n.created_at
              return (
                <div key={n.id} className="bg-white border border-border rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">{cfg.label}</p>
                    <p className="text-sm text-foreground leading-relaxed">{n.message || 'New notification'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
