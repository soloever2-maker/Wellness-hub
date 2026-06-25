'use client'

import { Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

const stats = [
  { icon: Calendar, label: "Today's Classes", value: '4', color: 'text-[#D63384]' },
  { icon: CheckCircle, label: "Today's Bookings", value: '18', color: 'text-[#7B2D8E]' },
  { icon: DollarSign, label: 'Month Revenue', value: '12,400 EGP', color: 'text-[#D63384]' },
  { icon: Users, label: 'Active Clients', value: '34', color: 'text-[#7B2D8E]' },
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
  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hi Enjy 👋 — June 25, 2026</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center relative">
            <span className="text-lg">🔔</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D63384] text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-border rounded-2xl p-4 shadow-sm border-l-4 border-l-[#D63384]">
              <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

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
            <Clock className="w-4 h-4 text-[#D63384]" />
            {"Today's Classes"}
          </h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {todaySchedule.map((cls, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < todaySchedule.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#D63384] w-20">{cls.time}</span>
                  <span className="text-sm font-medium text-foreground">{cls.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{cls.booked}/{cls.total}</span>
                  <button className="text-xs font-medium px-3 py-1.5 border border-[#D63384] text-[#D63384] rounded-full hover:bg-[#D63384]/5 transition-colors">
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
