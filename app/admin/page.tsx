'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock, UserCheck } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

const stats = [
  { icon: Calendar, label: "Today's Classes", value: '4', color: 'text-[#006D77]' },
  { icon: CheckCircle, label: "Today's Bookings", value: '18', color: 'text-[#E86500]' },
  { icon: DollarSign, label: 'Month Revenue', value: '12,400 EGP', color: 'text-[#006D77]' },
  { icon: Users, label: 'Active Clients', value: '34', color: 'text-[#E86500]' },
]

const alerts = [
  { text: '3 packages expiring this week', type: 'warning' },
  { text: 'Sarah Ahmed — 1 session remaining', type: 'warning' },
  { text: "Tomorrow's Pilates is full (waitlist: 2)", type: 'info' },
]

const todaySchedule = [
  { time: '11:00 AM', name: 'Power Yoga', booked: 8, total: 12 },
  { time: '5:00 PM', name: 'Mat Pilates', booked: 6, total: 10 },
  { time: '7:30 PM', name: 'Gentle Yoga', booked: 4, total: 8 },
]

const recentActivity = [
  { time: '2 min ago', text: 'Nour booked Power Yoga (11 AM)', icon: '📅' },
  { time: '15 min ago', text: 'Mona cancelled Mat Pilates', icon: '❌' },
  { time: '1 hr ago', text: 'Payment received: 1,200 EGP — Sara', icon: '💳' },
  { time: '2 hrs ago', text: 'Layla joined waitlist for Pilates', icon: '⏳' },
  { time: '3 hrs ago', text: 'New client registered: Yasmin', icon: '👤' },
]

export default function AdminDashboardPage() {
  const [firstName, setFirstName] = useState('')
  useEffect(() => {
    getCurrentUser().then(u => {
      if (u?.full_name) setFirstName(u.full_name.split(' ')[0])
    })
  }, [])

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hi {firstName || 'Enjy'} 👋 — {today}</p>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-border rounded-2xl p-4 shadow-sm border-l-4 border-l-[#006D77]">
              <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pending Approvals Banner */}
        <Link href="/admin/approvals">
          <div className="bg-gradient-to-r from-[#E86500] to-[#E86500]/80 rounded-2xl p-4 flex items-center justify-between shadow-md shadow-[#E86500]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Pending Approvals</p>
                <p className="text-white/80 text-xs">Review new client requests</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#E86500] font-bold text-sm">!</span>
            </div>
          </div>
        </Link>

        {/* Alerts */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF9800]" />
            Attention Needed
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <button key={i} className="w-full text-left bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-xl px-4 py-3 hover:bg-[#FF9800]/10 transition-colors">
                <p className="text-sm text-foreground">{alert.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#006D77]" />
            {"Today's Classes"}
          </h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {todaySchedule.map((cls, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < todaySchedule.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#006D77] w-20">{cls.time}</span>
                  <span className="text-sm font-medium text-foreground">{cls.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{cls.booked}/{cls.total}</span>
                  <button className="text-xs font-medium px-3 py-1.5 border border-[#006D77] text-[#006D77] rounded-full hover:bg-[#006D77]/5 transition-colors">
                    Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {recentActivity.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < recentActivity.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AdminBottomNav activePage="dashboard" />
    </main>
  )
}
