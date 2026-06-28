'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, CheckCircle, DollarSign, Users, AlertTriangle, Clock, UserCheck, TrendingUp, Package, ChevronLeft, ChevronRight, BarChart2, CreditCard } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Stats = {
  totalClients: number; pendingApprovals: number; activePackages: number
  totalRevenue: number; todayClasses: number; weekBookings: number; attendanceRate: number
}
type RecentBooking = {
  id: string; status: string; booked_at: string
  client: { full_name: string }
  session: { start_time: string; class_type: { name: string } }
}
type PendingRequest = {
  id: string; amount: number; created_at: string
  client: { id: string; full_name: string }
  package: { id: string; name: string }
}
type BookingRow = {
  id: string; status: string; booked_at: string
  client: { full_name: string }
  session: { start_time: string; class_type: { name: string } } | null
}
type PaymentRow = {
  id: string; amount: number; paid_at: string; status: string
  client: { full_name: string }
  package: { name: string }
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-[#006D77]/10 text-[#006D77]',
  attended:  'bg-[#4CAF50]/10 text-[#4CAF50]',
  no_show:   'bg-[#E53935]/10 text-[#E53935]',
  cancelled: 'bg-gray-100 text-gray-500',
  waiting:   'bg-[#FF9800]/10 text-[#FF9800]',
}

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}
function fmtMonth(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function initials(name: string) {
  return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

type Tab = 'overview' | 'bookings' | 'revenue'

export default function AdminDashboardPage() {
  const [firstName, setFirstName]     = useState('')
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState<Tab>('overview')

  // Overview data
  const [stats, setStats]                   = useState<Stats>({ totalClients:0, pendingApprovals:0, activePackages:0, totalRevenue:0, todayClasses:0, weekBookings:0, attendanceRate:0 })
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])

  // Bookings tab data
  const [bMonth, setBMonth]             = useState(new Date())
  const [classTypes, setClassTypes]     = useState<string[]>([])
  const [classFilter, setClassFilter]   = useState('All')
  const [allBookings, setAllBookings]   = useState<BookingRow[]>([])
  const [bLoading, setBLoading]         = useState(false)

  // Revenue tab data
  const [rMonth, setRMonth]             = useState(new Date())
  const [payments, setPayments]         = useState<PaymentRow[]>([])
  const [rLoading, setRLoading]         = useState(false)

  const today    = new Date()
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // ── Overview fetch ────────────────────────────────────────────
  useEffect(() => {
    getCurrentUser().then(u => { if (u?.full_name) setFirstName(u.full_name.split(' ')[0]) })
    const fetchOverview = async () => {
      try {
        const statsResult = await supabase.rpc('get_dashboard_stats')
        if (statsResult.data) {
          const d = statsResult.data as Record<string, number>
          const attended = d.attended || 0, totalMarked = d.totalMarked || 0
          setStats({ totalClients: d.totalClients||0, pendingApprovals: d.pendingApprovals||0, activePackages: d.activePackages||0, totalRevenue: d.totalRevenue||0, todayClasses: d.todayClasses||0, weekBookings: d.weekBookings||0, attendanceRate: totalMarked > 0 ? Math.round((attended/totalMarked)*100) : 0 })
        }
      } catch {}
      try {
        const { data } = await supabase.from('bookings')
          .select('id, status, booked_at, client:users!client_id(full_name), session:class_sessions(start_time, class_type:class_types(name))')
          .in('status', ['confirmed','attended']).order('booked_at', { ascending: false }).limit(5)
        if (data) setRecentBookings(data as unknown as RecentBooking[])
      } catch {}
      try {
        const { data } = await supabase.from('payments')
          .select('id, amount, created_at, client:users!client_id(id, full_name), package:packages!package_id(id, name)')
          .eq('status','pending').order('created_at', { ascending: false }).limit(10)
        if (data) setPendingRequests(data as unknown as PendingRequest[])
      } catch {}
      setLoading(false)
    }
    fetchOverview()
  }, [])

  // ── Bookings tab fetch ────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setBLoading(true)
    const { start, end } = monthRange(bMonth)
    const { data } = await supabase.from('bookings')
      .select('id, status, booked_at, client:users!client_id(full_name), session:class_sessions(start_time, class_type:class_types(name))')
      .gte('booked_at', start).lt('booked_at', end)
      .order('booked_at', { ascending: false })
    if (data) {
      setAllBookings(data as unknown as BookingRow[])
      const types = Array.from(new Set(
        data.map((b: any) => b.session?.class_type?.name).filter(Boolean)
      )) as string[]
      setClassTypes(types)
    }
    setBLoading(false)
  }, [bMonth])

  useEffect(() => { if (activeTab === 'bookings') fetchBookings() }, [activeTab, fetchBookings])

  // ── Revenue tab fetch ─────────────────────────────────────────
  const fetchRevenue = useCallback(async () => {
    setRLoading(true)
    const { start, end } = monthRange(rMonth)
    const { data } = await supabase.from('payments')
      .select('id, amount, status, paid_at, client:users!client_id(full_name), package:packages!package_id(name)')
      .eq('status','paid').gte('paid_at', start).lt('paid_at', end)
      .order('paid_at', { ascending: false })
    if (data) setPayments(data as unknown as PaymentRow[])
    setRLoading(false)
  }, [rMonth])

  useEffect(() => { if (activeTab === 'revenue') fetchRevenue() }, [activeTab, fetchRevenue])

  // ── Derived data ─────────────────────────────────────────────
  const filteredBookings = classFilter === 'All'
    ? allBookings
    : allBookings.filter(b => (b.session as any)?.class_type?.name === classFilter)

  const classCounts = allBookings.reduce((acc, b) => {
    const name = (b.session as any)?.class_type?.name
    if (name) acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const popularClasses = Object.entries(classCounts).sort((a,b) => b[1]-a[1])
  const monthRevenue   = payments.reduce((s, p) => s + Number(p.amount), 0)

  const statCards = [
    { icon: Users,      label: 'Total Clients',  value: stats.totalClients,                                           color: 'text-[#006D77]', border: 'border-l-[#006D77]' },
    { icon: Package,    label: 'Active Packages', value: stats.activePackages,                                         color: 'text-[#E86500]', border: 'border-l-[#E86500]' },
    { icon: DollarSign, label: 'Total Revenue',   value: `${stats.totalRevenue.toLocaleString()} EGP`,                color: 'text-[#006D77]', border: 'border-l-[#006D77]' },
    { icon: TrendingUp, label: 'Attendance Rate', value: stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : '—', color: 'text-[#E86500]', border: 'border-l-[#E86500]' },
  ]

  const tabs: { key: Tab; label: string; icon: typeof BarChart2 }[] = [
    { key: 'overview', label: 'Overview', icon: CheckCircle },
    { key: 'bookings', label: 'Bookings', icon: BarChart2   },
    { key: 'revenue',  label: 'Revenue',  icon: CreditCard  },
  ]

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Hi {firstName || 'Enjy'} 👋 — {todayStr}</p>
          </div>
          <UserMenu variant="admin" />
        </div>
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-white text-[#006D77] shadow-sm' : 'text-muted-foreground'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* ══ OVERVIEW TAB ══════════════════════════════════════ */}
        {activeTab === 'overview' && (<>

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

          <div className="grid grid-cols-2 gap-3">
            {statCards.map(s => (
              <div key={s.label} className={`bg-white border border-border ${s.border} border-l-4 rounded-2xl p-4 shadow-sm`}>
                <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
                <p className="text-xl font-bold text-foreground">{loading ? '—' : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

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

          {!loading && pendingRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#E86500]" /> Package Requests
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E86500]/10 text-[#E86500]">{pendingRequests.length} pending</span>
              </div>
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {pendingRequests.map((r, i) => (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i < pendingRequests.length-1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E86500]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#E86500]">{initials(r.client?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.client?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{r.package?.name} · {(r.amount||0).toLocaleString()} EGP</p>
                    </div>
                    {r.client?.id && (
                      <Link href={`/admin/clients?clientId=${r.client.id}${r.package?.id ? `&packageId=${r.package.id}` : ''}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#006D77] text-white shrink-0">
                        Confirm
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#006D77]" /> Recent Bookings
            </h3>
            {loading ? (
              <div className="bg-white border border-border rounded-2xl p-4 animate-pulse h-32" />
            ) : recentBookings.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {recentBookings.map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < recentBookings.length-1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#006D77]">{initials((b.client as any)?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(b.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{(b.session as any)?.class_type?.name} · {b.session ? fmtDateTime((b.session as any).start_time) : '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-500'}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && stats.activePackages === 0 && stats.totalClients > 0 && (
            <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">No Active Packages</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add packages to clients from the Clients page</p>
              </div>
            </div>
          )}
        </>)}

        {/* ══ BOOKINGS TAB ══════════════════════════════════════ */}
        {activeTab === 'bookings' && (<>

          {/* Month Selector */}
          <div className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
            <button onClick={() => setBMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{fmtMonth(bMonth)}</span>
            <button onClick={() => setBMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
              disabled={bMonth >= new Date(today.getFullYear(), today.getMonth(), 1)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {bLoading ? (
            <div className="bg-white border border-border rounded-2xl p-4 animate-pulse h-40" />
          ) : (<>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-border rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-bold text-[#006D77]">{allBookings.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-white border border-border rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-bold text-[#4CAF50]">{allBookings.filter(b => b.status === 'attended').length}</p>
                <p className="text-[10px] text-muted-foreground">Attended</p>
              </div>
              <div className="bg-white border border-border rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-bold text-[#E53935]">{allBookings.filter(b => b.status === 'no_show').length}</p>
                <p className="text-[10px] text-muted-foreground">No Show</p>
              </div>
            </div>

            {/* Popular Classes */}
            {popularClasses.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#E86500]" /> Most Popular Classes
                </p>
                <div className="space-y-2">
                  {popularClasses.map(([name, count], idx) => {
                    const max = popularClasses[0][1]
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-4 ${idx === 0 ? 'text-[#E86500]' : 'text-muted-foreground'}`}>{idx+1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-foreground">{name}</span>
                            <span className="text-xs text-muted-foreground">{count} bookings</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[#006D77] rounded-full" style={{ width: `${(count/max)*100}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Class Type Filter */}
            {classTypes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {['All', ...classTypes].map(ct => (
                  <button key={ct} onClick={() => setClassFilter(ct)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${classFilter === ct ? 'bg-[#006D77] text-white' : 'bg-white border border-border text-foreground'}`}>
                    {ct}
                  </button>
                ))}
              </div>
            )}

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">No bookings for this period</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {filteredBookings.map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 px-4 py-3 ${i < filteredBookings.length-1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#006D77]">{initials((b.client as any)?.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(b.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {(b.session as any)?.class_type?.name || '—'} · {fmtDate(b.booked_at)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-500'}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </>)}

        {/* ══ REVENUE TAB ═══════════════════════════════════════ */}
        {activeTab === 'revenue' && (<>

          {/* Month Selector */}
          <div className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
            <button onClick={() => setRMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{fmtMonth(rMonth)}</span>
            <button onClick={() => setRMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
              disabled={rMonth >= new Date(today.getFullYear(), today.getMonth(), 1)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {rLoading ? (
            <div className="bg-white border border-border rounded-2xl p-4 animate-pulse h-40" />
          ) : (<>

            {/* Revenue Hero */}
            <div className="bg-gradient-to-r from-[#006D77] to-[#E86500] rounded-2xl p-5 text-white shadow-lg">
              <p className="text-xs font-medium text-white/70 mb-1">Total Revenue — {fmtMonth(rMonth)}</p>
              <p className="text-4xl font-bold">{monthRevenue.toLocaleString()}</p>
              <p className="text-sm text-white/70 mt-0.5">EGP from {payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Payments List */}
            {payments.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <p className="text-sm text-muted-foreground">No payments recorded for this month</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {payments.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < payments.length-1 ? 'border-b border-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-[#006D77]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{(p.client as any)?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{(p.package as any)?.name || '—'} · {p.paid_at ? fmtDate(p.paid_at) : '—'}</p>
                    </div>
                    <span className="text-sm font-bold text-[#006D77] shrink-0">{Number(p.amount).toLocaleString()} EGP</span>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </>)}

      </div>
      <AdminBottomNav activePage="dashboard" />
    </main>
  )
}
