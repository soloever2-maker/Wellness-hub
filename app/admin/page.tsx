'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock, UserCheck, TrendingUp, Package } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Stats = {
  totalClients: number
  pendingApprovals: number
  activePackages: number
  totalRevenue: number
  todayClasses: number
  todayBookings: number
  weekBookings: number
  attendanceRate: number
}

type RecentBooking = {
  id: string
  status: string
  created_at: string
  client: { full_name: string }
  session: { start_time: string; class_type: { name: string } }
}

export default function AdminDashboardPage() {
  const [firstName, setFirstName] = useState('')
  const [stats, setStats] = useState<Stats>({
    totalClients: 0, pendingApprovals: 0, activePackages: 0, totalRevenue: 0,
    todayClasses: 0, todayBookings: 0, weekBookings: 0, attendanceRate: 0,
  })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7)

  useEffect(() => {
    getCurrentUser().then(u => { if (u?.full_name) setFirstName(u.full_name.split(' ')[0]) })

    const fetchStats = async () => {
      const [
        clientsRes, pendingRes, packagesRes, revenueRes,
        todayClassesRes, todayBookingsRes, weekBookingsRes,
        attendedRes, totalMarkedRes, recentRes
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'approved').eq('role', 'client'),
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('client_packages').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount').eq('status', 'paid'),
        supabase.from('class_sessions').select('id', { count: 'exact' }).eq('is_cancelled', false).gte('start_time', todayStart.toISOString()).lte('start_time', todayEnd.toISOString()),
        supabase.from('bookings').select('id', { count: 'exact' }).eq('status', 'confirmed').gte('created_at', todayStart.toISOString()),
        supabase.from('bookings').select('id', { count: 'exact' }).gte('created_at', weekStart.toISOString()),
        supabase.from('bookings').select('id', { count: 'exact' }).eq('status', 'attended'),
        supabase.from('bookings').select('id', { count: 'exact' }).in('status', ['attended', 'no_show']),
        supabase.from('bookings').select('id, status, created_at, client:users(full_name), session:class_sessions(start_time, class_type:class_types(name))')
          .in('status', ['confirmed', 'attended'])
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const revenue = revenueRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const attended = attendedRes.count || 0
      const totalMarked = totalMarkedRes.count || 1
      const attendanceRate = Math.round((attended / totalMarked) * 100)

      setStats({
        totalClients: clientsRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
        activePackages: packagesRes.count || 0,
        totalRevenue: revenue,
        todayClasses: todayClassesRes.count || 0,
        todayBookings: todayBookingsRes.count || 0,
        weekBookings: weekBookingsRes.count || 0,
        attendanceRate,
      })

      if (recentRes.data) setRecentBookings(recentRes.data as unknown as RecentBooking[])
      setLoading(false)
    }
    fetchStats()
  }, [])

  const statCards = [
    { icon: Users,       label: 'Total Clients',   value: stats.totalClients,              color: 'text-[#006D77]', border: 'border-l-[#006D77]' },
    { icon: Package,     label: 'Active Packages',  value: stats.activePackages,            color: 'text-[#E86500]', border: 'border-l-[#E86500]' },
    { icon: DollarSign,  label: 'Total Revenue',    value: `${stats.totalRevenue.toLocaleString()} EGP`, color: 'text-[#006D77]', border: 'border-l-[#006D77]' },
    { icon: TrendingUp,  label: 'Attendance Rate',  value: stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : '—', color: 'text-[#E86500]', border: 'border-l-[#E86500]' },
  ]

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Hi {firstName || 'Enjy'} 👋 — {todayStr}</p>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* Pending Approvals Banner */}
        {stats.pendingApprovals > 0 && (
          <Link href="/admin/approvals">
            <div className="bg-gradient-to-r from-[#E86500] to-[#E86500]/80 rounded-2xl p-4 flex items-center justify-between shadow-md shadow-[#E86500]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}</p>
                  <p className="text-white/80 text-xs">Tap to review new requests</p>
                </div>
              </div>
              <span className="text-white text-xl font-bold">→</span>
            </div>
          </Link>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`bg-white border border-border ${s.border} border-l-4 rounded-2xl p-4 shadow-sm`}>
              <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
              <p className="text-xl font-bold text-foreground">{loading ? '—' : s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm text-center">
            <Calendar className="w-5 h-5 text-[#006D77] mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{loading ? '—' : stats.todayClasses}</p>
            <p className="text-xs text-muted-foreground">Classes today</p>
          </div>
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm text-center">
            <CheckCircle className="w-5 h-5 text-[#E86500] mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{loading ? '—' : stats.weekBookings}</p>
            <p className="text-xs text-muted-foreground">Bookings this week</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006D77]" /> Recent Bookings
            </h3>
          </div>
          {loading ? (
            <div className="bg-white border border-border rounded-2xl p-4 animate-pulse h-32" />
          ) : recentBookings.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No bookings yet</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
              {recentBookings.map((b, i) => {
                const name = (b.client as any)?.full_name || '—'
                const className = (b.session as any)?.class_type?.name || '—'
                const time = b.session ? new Date((b.session as any).start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'
                return (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentBookings.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#006D77]">{name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{className} · {time}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.status === 'attended' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' : 'bg-[#E0EEF0] text-[#006D77]'
                    }`}>{b.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        {!loading && stats.activePackages === 0 && stats.totalClients > 0 && (
          <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">No Active Packages</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add packages to clients from the Clients page</p>
            </div>
          </div>
        )}
      </div>

      <AdminBottomNav activePage="dashboard" />
    </main>
  )
}
