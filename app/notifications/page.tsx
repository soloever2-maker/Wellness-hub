'use client'

import { useState } from 'react'
import { ArrowLeft, Bell, Calendar, Clock, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type NotificationType = 'booking' | 'reminder' | 'package' | 'system'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Class Tomorrow',
    message: 'Power Yoga with Enjy at 11:00 AM. See you there! 🧘‍♀️',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'booking',
    title: 'Booking Confirmed ✓',
    message: 'Your Mat Pilates class on Monday at 5:00 PM is confirmed.',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'package',
    title: 'Package Update',
    message: 'You have 5 sessions remaining in your 8 Classes package.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Welcome to Align with Enjy! 🌿',
    message: 'Your account has been approved. Start booking your first class!',
    time: '3 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Class in 2 Hours',
    message: 'Gentle Yoga at 7:30 PM. Bring your mat and water bottle.',
    time: '5 days ago',
    read: true,
  },
]

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  booking: { icon: CheckCircle2, color: '#006D77', bg: '#E0EEF0' },
  reminder: { icon: Clock, color: '#E86500', bg: '#FFD9B8' },
  package: { icon: Package, color: '#006D77', bg: '#E0EEF0' },
  system: { icon: AlertCircle, color: '#E86500', bg: '#FFD9B8' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-[#006D77] hover:text-[#004E5C]"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">You&apos;ll see updates about your bookings here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = typeConfig[notif.type]
              const Icon = config.icon
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full text-left bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex gap-3 ${
                    !notif.read ? 'border-l-4 border-l-[#E86500]' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm ${!notif.read ? 'font-bold' : 'font-semibold'} text-foreground`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#E86500] shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground/70">{notif.time}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
