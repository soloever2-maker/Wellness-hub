'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock,
  UserCheck, TrendingUp, Package, ChevronLeft, ChevronRight,
  BarChart2, CreditCard, Zap, AlertCircle, RefreshCw
} from 'lucide-react'
import { AdminBottomNav }  from '@/components/admin-bottom-nav'
import { UserMenu }        from '@/components/user-menu'
import { getCurrentUser }  from '@/lib/auth'
import { supabase }        from '@/lib/supabase'
import Link                from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  totalClients: number; pendingApprovals: number; activePackages: number
  totalRevenue: number; todayClasses: number; weekBookings: number
  attended: number; totalMarked: number
}

type PendingRequest = {
  id: string; amount: number; created_at: string
  client:  { id: string; full_name: string }
  package: { id: string; name: string }
  hasActivePackage?: boolean  // true = replacement request
}

type RecentBooking = {
  id: string; status: string; booked_at: string
  client:  { full_name: string }
  session: { start_time: string; class_type: { name: string } } | null
}

type ExpiringPkg = {
  id: string; expiry_date: string; sessions_remaining: number
  client: { full_name: string }
}

type TodaySession = {
  id: string
  start_time: string
  end_time: string
  max_capacity: number
  booked_count: number
  class_type: { name: string }
}

const CLASS_EMOJI: Record<string, string> = {
  'Power Yoga': '🔥', 'Mat Pilates': '💪', 'Gentle Yoga & Recovery': '🧘',
  'Belly Rhythmic Dancing': '💃', 'Aqua Aerobics': '🌊',
}

type BookingRow = {
  id: string; status: string; booked_at: string
  client:  { full_name: string }
  session: { start_time: string; class_type: { name: string } } | null
}

type PaymentRow = {
  id: string; amount: number; status: string
  paid_at: string | null; created_at: string
  client:  { full_name: string }
  package: { name: string }
}

type Tab = 'overview' | 'bookings' | 'revenue'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-[#006D77]/10 text-[#006D77]',
  attended:  'bg-[#4CAF50]/10 text-[#4CAF50]',
  no_show:   'bg-[#E53935]/10 text-[#E53935]',
  cancelled: 'bg-gray-100      text-gray-400',
  waiting:   'bg-[#FF9800]/10 text-[#FF9800]',
}

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function daysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {

  // ── Shared state ────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const today = new Date()

  // ── Overview state ──────────────────────────────────────────
  const [statsLoading, setStatsLoading]   = useState(true)
  const [stats, setStats]                 = useState<Stats>({ totalClients:0, pendingApprovals:0, activePackages:0, totalRevenue:0, todayClasses:0, weekBookings:0, attended:0, totalMarked:0 })
  const [monthRevOvr, setMonthRevOvr]     = useState(0)   // revenue this month (for overview card)
  const [pendingReqs, setPendingReqs]     = useState<PendingRequest[]>([])
  const [recentBooks, setRecentBooks]     = useState<RecentBooking[]>([])
  const [expiring, setExpiring]           = useState<ExpiringPkg[]>([])
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([])

  // ── Bookings tab state ──────────────────────────────────────
  const [bMonth, setBMonth]               = useState(new Date())
  const [bLoading, setBLoading]           = useState(false)
  const [allBookings, setAllBookings]     = useState<BookingRow[]>([])
  const [classTypes, setClassTypes]       = useState<string[]>([])
  const [classFilter, setClassFilter]     = useState('All')

  // ── Revenue tab state ───────────────────────────────────────
  const [rMonth, setRMonth]               = useState(new Date())
  const [rLoading, setRLoading]           = useState(false)
  const [payments, setPayments]           = useState<PaymentRow[]>([])

  const todayStr = today.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  // ── Overview fetch ───────────────────────────────────────────
  useEffect(() => {
    getCurrentUser().then(u => {
      if (u?.full_name) setFirstName(u.full_name.split(' ')[0])
    })

    const run = async () => {
      setStatsLoading(true)

      // 1. RPC stats
      try {
        const { data } = await supabase.rpc('get_dashboard_stats')
        if (data) setStats(data as Stats)
      } catch {}

      // 2. Monthly revenue for current month (overview card)
      try {
        const { start, end } = monthBounds(new Date())
        const { data } = await supabase.from('payments')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', start)
          .lt('paid_at', end)
        if (data) setMonthRevOvr(data.reduce((s, r) => s + Number(r.amount), 0))
      } catch {}

      // 3. Pending package requests
      try {
        const { data } = await supabase.from('payments')
          .select('id, amount, created_at, client:users!client_id(id, full_name), package:packages!package_id(id, name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)
        if (data) {
          // Check which clients already have an active package (= replacement request)
          const clientIds = [...new Set((data as any[]).map(r => r.client?.id).filter(Boolean))]
          const { data: activePkgs } = await supabase
            .from('client_packages')
            .select('client_id')
            .in('client_id', clientIds)
            .in('status', ['active', 'frozen'])
          const activeSet = new Set((activePkgs ?? []).map((p: any) => p.client_id))
          const enriched = (data as any[]).map(r => ({
            ...r,
            hasActivePackage: activeSet.has(r.client?.id),
          }))
          setPendingReqs(enriched as unknown as PendingRequest[])
        }
      } catch {}

      // 4. Recent bookings (last 5)
      try {
        const { data } = await supabase.from('bookings')
          .select('id, status, booked_at, client:users!client_id(full_name), session:class_sessions(start_time, class_type:class_types(name))')
          .in('status', ['confirmed', 'attended'])
          .order('booked_at', { ascending: false })
          .limit(5)
        if (data) setRecentBooks(data as unknown as RecentBooking[])
      } catch {}

      // 5. Expiring packages within 7 days
      try {
        const in7 = new Date()
        in7.setDate(in7.getDate() + 7)
        const { data } = await supabase.from('client_packages')
          .select('id, expiry_date, sessions_remaining, client:users!client_id(full_name)')
          .eq('status', 'active')
          .lte('expiry_date', in7.toISOString())
          .gt('expiry_date', new Date().toISOString())
          .order('expiry_date')
        if (data) setExpiring(data as unknown as ExpiringPkg[])
      } catch {}

      // 6. Today's sessions (agenda)
      try {
        const dayStart = new Date(); dayStart.setHours(0,0,0,0)
        const dayEnd = new Date(); dayEnd.setHours(23,59,59,999)
        const { data } = await supabase.from('class_sessions')
          .select('id, start_time, end_time, max_capacity, booked_count, class_type:class_types(name)')
          .eq('is_cancelled', false)
          .gte('start_time', dayStart.toISOString())
          .lte('start_time', dayEnd.toISOString())
          .order('start_time')
        if (data) setTodaySessions(data as unknown as TodaySession[])
      } catch {}

      setStatsLoading(false)
    }

    run()
  }, [])

  // ── Bookings fetch ───────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setBLoading(true)
    try {
      const { start, end } = monthBounds(bMonth)
      const { data, error } = await supabase.from('bookings')
        .select('id, status, booked_at, client:users!client_id(full_name), session:class_sessions(start_time, class_type:class_types(name))')
        .gte('booked_at', start)
        .lt('booked_at', end)
        .order('booked_at', { ascending: false })

      if (error) throw error
      const rows = (data ?? []) as unknown as BookingRow[]
      setAllBookings(rows)

      // Unique class types from results (client-side — never filter on joined columns)
      const types = Array.from(new Set(
        rows.map(b => b.session?.class_type?.name).filter(Boolean)
      )) as string[]
      setClassTypes(types)
      setClassFilter('All')
    } catch (err) {
      console.error('Bookings fetch error:', err)
    }
    setBLoading(false)
  }, [bMonth])

  useEffect(() => { if (activeTab === 'bookings') fetchBookings() }, [activeTab, fetchBookings])

  // ── Revenue fetch ────────────────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    setRLoading(true)
    try {
      const { start, end } = monthBounds(rMonth)
      const { data, error } = await supabase.from('payments')
        .select('id, amount, status, paid_at, created_at, client:users!client_id(full_name), package:packages!package_id(name)')
        .eq('status', 'paid')
        .gte('paid_at', start)
        .lt('paid_at', end)
        .order('paid_at', { ascending: false })

      if (error) throw error
      setPayments((data ?? []) as unknown as PaymentRow[])
    } catch (err) {
      console.error('Revenue fetch error:', err)
    }
    setRLoading(false)
  }, [rMonth])

  useEffect(() => { if (activeTab === 'revenue') fetchRevenue() }, [activeTab, fetchRevenue])

  // ── Derived / computed ───────────────────────────────────────

  const attendanceRate = stats.totalMarked > 0
    ? Math.round((stats.attended / stats.totalMarked) * 100)
    : null

  // Bookings filtered by class type (client-side only)
  const filteredBookings = classFilter === 'All'
    ? allBookings
    : allBookings.filter(b => b.session?.class_type?.name === classFilter)

  // Class popularity (from current month bookings)
  const classCounts = allBookings.reduce((acc, b) => {
    const name = b.session?.class_type?.name
    if (name) acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const popularClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1])

  // Booking status breakdown
  const bookingBreakdown = ['confirmed','attended','no_show','cancelled'].map(s => ({
    status: s,
    count:  allBookings.filter(b => b.status === s).length,
  }))

  // Revenue by package (group client-side)
  const revByPkg = payments.reduce((acc, p) => {
    const name = (p.package as any)?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(p.amount)
    return acc
  }, {} as Record<string, number>)
  const revByPkgEntries = Object.entries(revByPkg).sort((a, b) => b[1] - a[1])

  const monthTotal = payments.reduce((s, p) => s + Number(p.amount), 0)
  const avgRevPerClient = stats.totalClients > 0
    ? Math.round(monthTotal / stats.totalClients)
    : 0

  const isCurrentMonth = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()

  // ── Month navigation helpers ─────────────────────────────────
  const prevBMonth = () => setBMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextBMonth = () => setBMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const prevRMonth = () => setRMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextRMonth = () => setRMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview',  Icon: CheckCircle },
    { key: 'bookings' as Tab, label: 'Bookings',  Icon: BarChart2   },
    { key: 'revenue'  as Tab, label: 'Revenue',   Icon: CreditCard  },
  ]

  // ── Render ────────────────────────────────────────────────────
  return (
    <main className="bg-background min-h-screen pb-24">

      {/* ── Sticky header + tab bar ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Hi {firstName || 'Enjy'} 👋 — {todayStr}</p>
          </div>
          <UserMenu variant="admin" />
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === key ? 'bg-white text-[#006D77] shadow-sm' : 'text-muted-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ════════════════════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (<>

          {/* Pending approvals banner */}
          {stats.pendingApprovals > 0 && (
            <Link href="/admin/approvals">
              <div className="bg-gradient-to-r from-[#E86500] to-[#E86500]/80 rounded-2xl p-4 flex items-center justify-between shadow-md shadow-[#E86500]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}</p>
                    <p className="text-white/80 text-xs">Tap to review</p>
                  </div>
                </div>
                <span className="text-white text-lg">→</span>
              </div>
            </Link>
          )}

          {/* Stat cards — 2×2 grid */}
          <div className="grid grid-cols-2 gap-3">

            {/* Total Clients */}
            <div className="bg-white border border-border border-l-4 border-l-[#006D77] rounded-2xl p-4 shadow-sm">
              <Users className="w-4 h-4 text-[#006D77] mb-2" />
              <p className="text-2xl font-bold text-foreground">{statsLoading ? '—' : stats.totalClients}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
            </div>

            {/* Active Packages */}
            <div className="bg-white border border-border border-l-4 border-l-[#E86500] rounded-2xl p-4 shadow-sm">
              <Package className="w-4 h-4 text-[#E86500] mb-2" />
              <p className="text-2xl font-bold text-foreground">{statsLoading ? '—' : stats.activePackages}</p>
              <p className="text-xs text-muted-foreground">Active Packages</p>
            </div>

            {/* This month revenue */}
            <div className="bg-white border border-border border-l-4 border-l-[#006D77] rounded-2xl p-4 shadow-sm">
              <DollarSign className="w-4 h-4 text-[#006D77] mb-2" />
              <p className="text-2xl font-bold text-foreground leading-tight">
                {statsLoading ? '—' : `${monthRevOvr.toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground">Revenue this month</p>
              {!statsLoading && stats.totalRevenue > 0 && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {stats.totalRevenue.toLocaleString()} EGP all-time
                </p>
              )}
            </div>

            {/* Attendance Rate */}
            <div className="bg-white border border-border border-l-4 border-l-[#E86500] rounded-2xl p-4 shadow-sm">
              <TrendingUp className="w-4 h-4 text-[#E86500] mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {statsLoading ? '—' : attendanceRate !== null ? `${attendanceRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </div>
          </div>

          {/* Classes today / Bookings this week */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm text-center">
              <Calendar className="w-5 h-5 text-[#006D77] mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">{statsLoading ? '—' : stats.todayClasses}</p>
              <p className="text-xs text-muted-foreground">Classes today</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm text-center">
              <CheckCircle className="w-5 h-5 text-[#E86500] mx-auto mb-1.5" />
              <p className="text-2xl font-bold text-foreground">{statsLoading ? '—' : stats.weekBookings}</p>
              <p className="text-xs text-muted-foreground">Bookings this week</p>
            </div>
          </div>

          {/* Today's Agenda */}
          {!statsLoading && todaySessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#006D77]" />
                  <h3 className="text-sm font-semibold text-foreground">Today&apos;s Agenda</h3>
                </div>
                <Link href="/admin/attendance" className="text-xs font-medium text-[#006D77]">
                  Mark Attendance →
                </Link>
              </div>
              <div className="space-y-2">
                {todaySessions.map(s => {
                  const name = (s.class_type as any)?.name || 'Class'
                  const emoji = CLASS_EMOJI[name] || '🧘'
                  const time = new Date(s.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  const endTime = new Date(s.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  const spotsLeft = s.max_capacity - s.booked_count
                  const isFull = spotsLeft <= 0
                  const isPast = new Date(s.end_time) < new Date()
                  return (
                    <Link key={s.id} href="/admin/attendance" className="block">
                      <div className={`bg-white border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow ${isPast ? 'opacity-50' : ''}`}>
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{time} – {endTime}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{s.booked_count}/{s.max_capacity}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-[#E53935]/10 text-[#E53935]' : isPast ? 'bg-gray-100 text-gray-400' : 'bg-[#E0EEF0] text-[#006D77]'
                          }`}>
                            {isPast ? 'Done' : isFull ? 'Full' : `${spotsLeft} spots`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expiring soon */}
          {!statsLoading && expiring.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-[#FF9800]" />
                <h3 className="text-sm font-semibold text-foreground">Expiring Soon</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF9800]/10 text-[#FF9800] font-medium">{expiring.length}</span>
              </div>
              <div className="bg-white border border-[#FF9800]/20 rounded-2xl overflow-hidden shadow-sm">
                {expiring.map((e, i) => (
                  <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i < expiring.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#FF9800]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#FF9800]">{initials((e.client as any)?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(e.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{e.sessions_remaining} sessions left</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      daysLeft(e.expiry_date) <= 2 ? 'bg-[#E53935]/10 text-[#E53935]' : 'bg-[#FF9800]/10 text-[#FF9800]'
                    }`}>
                      {daysLeft(e.expiry_date)}d left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Package Requests */}
          {!statsLoading && pendingReqs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#E86500]" />
                  <h3 className="text-sm font-semibold text-foreground">Package Requests</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E86500]/10 text-[#E86500] font-medium">{pendingReqs.length}</span>
              </div>
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {pendingReqs.map((r, i) => (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i < pendingReqs.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E86500]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#E86500]">{initials(r.client?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">{r.client?.full_name || '—'}</p>
                        {r.hasActivePackage && (
                          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-[#E86500]/10 text-[#E86500] rounded-full">♻️ Replace</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{r.package?.name} · {Number(r.amount).toLocaleString()} EGP</p>
                    </div>
                    <Link
                      href={`/admin/clients?clientId=${r.client?.id}&packageId=${r.package?.id}`}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#006D77] text-white">
                      Confirm
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#006D77]" />
              <h3 className="text-sm font-semibold text-foreground">Recent Bookings</h3>
            </div>
            {statsLoading ? (
              <div className="bg-white border border-border rounded-2xl h-28 animate-pulse" />
            ) : recentBooks.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {recentBooks.map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentBooks.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#006D77]">{initials((b.client as any)?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(b.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.session?.class_type?.name || '—'} · {b.session ? fmtDateTime(b.session.start_time) : '—'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No active packages warning */}
          {!statsLoading && stats.activePackages === 0 && stats.totalClients > 0 && (
            <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">No Active Packages</p>
                <p className="text-xs text-muted-foreground mt-0.5">Go to Clients to add a package</p>
              </div>
            </div>
          )}
        </>)}

        {/* ════════════════════════════════════════════════════════
            BOOKINGS TAB
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'bookings' && (<>

          {/* Month selector */}
          <div className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
            <button onClick={prevBMonth}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{fmtMonth(bMonth)}</span>
              {!isCurrentMonth(bMonth) && (
                <button onClick={() => { setBMonth(new Date()); setClassFilter('All') }}
                  className="text-[10px] text-[#006D77] border border-[#006D77]/30 px-2 py-0.5 rounded-full">
                  Today
                </button>
              )}
            </div>
            <button onClick={nextBMonth}
              disabled={isCurrentMonth(bMonth)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {bLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(k => <div key={k} className="bg-white border border-border rounded-2xl h-20 animate-pulse" />)}
            </div>
          ) : (<>

            {/* Status breakdown row */}
            <div className="grid grid-cols-4 gap-2">
              {bookingBreakdown.map(({ status, count }) => (
                <div key={status} className="bg-white border border-border rounded-xl p-2.5 text-center shadow-sm">
                  <p className={`text-lg font-bold ${
                    status === 'attended'  ? 'text-[#4CAF50]' :
                    status === 'no_show'   ? 'text-[#E53935]' :
                    status === 'confirmed' ? 'text-[#006D77]' : 'text-gray-400'
                  }`}>{count}</p>
                  <p className="text-[9px] text-muted-foreground capitalize leading-tight mt-0.5">
                    {status.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>

            {/* Popular classes */}
            {popularClasses.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#E86500]" /> Most Popular Classes
                  </p>
                  <span className="text-[10px] text-muted-foreground">{allBookings.length} total bookings</span>
                </div>
                <div className="space-y-2.5">
                  {popularClasses.map(([name, count], idx) => {
                    const max = popularClasses[0][1]
                    const pct = Math.round((count / allBookings.length) * 100)
                    return (
                      <div key={name} className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold w-4 shrink-0 ${idx === 0 ? 'text-[#E86500]' : 'text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground truncate">{name}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{count} · {pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#006D77] to-[#E86500]"
                              style={{ width: `${(count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Class type filter pills */}
            {classTypes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {['All', ...classTypes].map(ct => (
                  <button key={ct} onClick={() => setClassFilter(ct)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      classFilter === ct
                        ? 'bg-[#006D77] text-white'
                        : 'bg-white border border-border text-foreground'
                    }`}>
                    {ct}
                    {ct !== 'All' && (
                      <span className="ml-1 text-[10px] opacity-60">
                        {allBookings.filter(b => b.session?.class_type?.name === ct).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-10 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No bookings for this period</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {filteredBookings.map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < filteredBookings.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#006D77]">{initials((b.client as any)?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(b.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.session?.class_type?.name || '—'} · {fmtDate(b.booked_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </>)}

        {/* ════════════════════════════════════════════════════════
            REVENUE TAB
        ════════════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (<>

          {/* Month selector */}
          <div className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
            <button onClick={prevRMonth}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{fmtMonth(rMonth)}</span>
              {!isCurrentMonth(rMonth) && (
                <button onClick={() => setRMonth(new Date())}
                  className="text-[10px] text-[#006D77] border border-[#006D77]/30 px-2 py-0.5 rounded-full">
                  Today
                </button>
              )}
            </div>
            <button onClick={nextRMonth}
              disabled={isCurrentMonth(rMonth)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {rLoading ? (
            <div className="space-y-3">
              {[1,2].map(k => <div key={k} className="bg-white border border-border rounded-2xl h-24 animate-pulse" />)}
            </div>
          ) : (<>

            {/* Revenue hero */}
            <div className="bg-gradient-to-r from-[#004E5C] via-[#006D77] to-[#E86500] rounded-2xl p-5 text-white shadow-lg">
              <p className="text-xs text-white/60 mb-1">Revenue — {fmtMonth(rMonth)}</p>
              <p className="text-4xl font-bold tracking-tight">{monthTotal.toLocaleString()}</p>
              <p className="text-sm text-white/70 mt-0.5">EGP · {payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
              {stats.totalClients > 0 && (
                <p className="text-[11px] text-white/50 mt-2">
                  Avg per client: {avgRevPerClient.toLocaleString()} EGP
                </p>
              )}
            </div>

            {/* Revenue by package */}
            {revByPkgEntries.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                  <Package className="w-3.5 h-3.5 text-[#006D77]" /> Revenue by Package
                </p>
                <div className="space-y-2.5">
                  {revByPkgEntries.map(([name, amount]) => {
                    const pct = monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground truncate max-w-[60%]">{name}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{amount.toLocaleString()} EGP · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#006D77]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payments list */}
            {payments.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-10 text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payments this month</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-foreground px-1 -mb-2">All Payments</p>
                <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                  {payments.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < payments.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-[#006D77]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{(p.client as any)?.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {(p.package as any)?.name || '—'} · {fmtDate(p.paid_at ?? p.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-[#006D77] shrink-0">
                        {Number(p.amount).toLocaleString()} EGP
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>)}
        </>)}

      </div>

      <AdminBottomNav activePage="dashboard" />
    </main>
  )
}
