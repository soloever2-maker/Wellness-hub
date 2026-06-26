'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock, UserCheck, Database } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

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
            <p className="text-sm text-muted-foreground">Hi {firstName || 'there'} 👋 — {today}</p>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Stats Grid — will be connected to v_admin_stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: "Today's Classes", value: '—', color: 'text-[#006D77]' },
            { icon: CheckCircle, label: "Today's Bookings", value: '—', color: 'text-[#E86500]' },
            { icon: DollarSign, label: 'Month Revenue', value: '—', color: 'text-[#006D77]' },
            { icon: Users, label: 'Active Clients', value: '—', color: 'text-[#E86500]' },
          ].map((stat) => (
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
              <span className="text-[#E86500] font-bold text-sm">→</span>
            </div>
          </div>
        </Link>

        {/* Alerts — empty state */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF9800]" />
            Attention Needed
          </h3>
          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center text-center">
            <Database className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Alerts will appear here once classes and packages are active</p>
          </div>
        </div>

        {/* Today's Schedule — empty state */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#006D77]" />
            {"Today's Classes"}
          </h3>
          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
            <Link href="/admin/schedule" className="text-xs text-[#006D77] font-medium mt-2">
              + Add a class
            </Link>
          </div>
        </div>

        {/* Recent Activity — empty state */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="bg-white border border-border rounded-2xl p-6 flex flex-col items-center text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Activity will show here as clients book and attend classes</p>
          </div>
        </div>
      </div>

      <AdminBottomNav activePage="dashboard" />
    </main>
  )
}
