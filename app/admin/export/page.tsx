// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/admin/export/page.tsx
// (فلتر تواريخ: All time / This month / Last month / Custom)
// ============================================================

'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Users, Calendar, DollarSign, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type ExportOption = {
  id: string
  icon: typeof Users
  label: string
  desc: string
  color: string
}

const options: ExportOption[] = [
  { id: 'clients',   icon: Users,       label: 'Clients Report',     desc: 'All clients with packages & attendance stats', color: 'text-[#006D77]' },
  { id: 'bookings',  icon: Calendar,    label: 'Bookings Report',    desc: 'All bookings with class and client details',    color: 'text-[#E86500]' },
  { id: 'payments',  icon: DollarSign,  label: 'Revenue Report',     desc: 'All payments with method and amounts',          color: 'text-[#006D77]' },
  { id: 'full',      icon: Download,    label: 'Full Report (All)',   desc: 'All 3 sheets in one Excel file',                color: 'text-[#E86500]' },
]

type RangeId = 'all' | 'this_month' | 'last_month' | 'custom'

// بداية/نهاية شهر معيّن
function monthRange(offset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start, end }
}

export default function AdminExportPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [range, setRange] = useState<RangeId>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // يحسب المدى الزمني المختار كـ ISO strings (أو null لو "كل الفترات")
  const getBounds = (): { startISO: string | null; endISO: string | null } => {
    if (range === 'all') return { startISO: null, endISO: null }
    if (range === 'this_month') {
      const { start, end } = monthRange(0)
      return { startISO: start.toISOString(), endISO: end.toISOString() }
    }
    if (range === 'last_month') {
      const { start, end } = monthRange(-1)
      return { startISO: start.toISOString(), endISO: end.toISOString() }
    }
    // custom
    const startISO = customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : null
    // نهاية اليوم المختار (شامل)
    const endISO = customTo ? new Date(customTo + 'T23:59:59.999').toISOString() : null
    return { startISO, endISO }
  }

  // اسم الفترة للاستخدام في اسم الملف
  const rangeLabel = (): string => {
    if (range === 'this_month') return 'ThisMonth'
    if (range === 'last_month') return 'LastMonth'
    if (range === 'custom' && (customFrom || customTo)) return `${customFrom || 'start'}_to_${customTo || 'end'}`
    return 'AllTime'
  }

  const handleExport = async (type: string) => {
    setLoading(type)
    setDone(null)

    try {
      const XLSX = await import('xlsx')

      const wb = XLSX.utils.book_new()

      // ── Fetch data ──────────────────────────────────────────
      if (type === 'clients' || type === 'full') {
        const { data: clients } = await supabase
          .from('users')
          .select('full_name, phone, status, role, created_at')
          .order('created_at', { ascending: false })

        const { data: packages } = await supabase
          .from('client_packages')
          .select('client_id, sessions_total, sessions_remaining, status, expiry_date, created_at, package:packages(name)')

        const { data: bookings } = await supabase
          .from('bookings')
          .select('client_id, status')

        const pkgMap: Record<string, any> = {}
        packages?.forEach(p => { pkgMap[p.client_id] = p })

        const bookingStats: Record<string, { total: number; attended: number; noShow: number }> = {}
        bookings?.forEach(b => {
          if (!bookingStats[b.client_id]) bookingStats[b.client_id] = { total: 0, attended: 0, noShow: 0 }
          bookingStats[b.client_id].total++
          if (b.status === 'attended') bookingStats[b.client_id].attended++
          if (b.status === 'no_show') bookingStats[b.client_id].noShow++
        })

        const clientsData = (clients || []).map(c => {
          const pkg = pkgMap[(c as any).id]
          const bStats = bookingStats[(c as any).id] || { total: 0, attended: 0, noShow: 0 }
          const attRate = bStats.total > 0 ? `${Math.round((bStats.attended / bStats.total) * 100)}%` : '—'
          return {
            'Full Name': c.full_name || '—',
            'Phone': c.phone || '—',
            'Status': c.status,
            'Role': c.role,
            'Joined': new Date(c.created_at).toLocaleDateString('en-GB'),
            'Package': pkg ? (pkg.package as any)?.name || '—' : '—',
            'Sessions Total': pkg?.sessions_total || '—',
            'Sessions Remaining': pkg?.sessions_remaining || '—',
            'Package Status': pkg?.status || '—',
            'Package Expiry': pkg ? new Date(pkg.expiry_date).toLocaleDateString('en-GB') : '—',
            'Total Bookings': bStats.total,
            'Attended': bStats.attended,
            'No Show': bStats.noShow,
            'Attendance Rate': attRate,
          }
        })

        const ws = XLSX.utils.json_to_sheet(clientsData)
        ws['!cols'] = [
          { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 12 },
          { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
          { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 16 },
        ]
        XLSX.utils.book_append_sheet(wb, ws, 'Clients')
      }

      const { startISO, endISO } = getBounds()

      if (type === 'bookings' || type === 'full') {
        let q = supabase
          .from('bookings')
          .select('status, created_at, client:users(full_name, phone), session:class_sessions(start_time, class_type:class_types(name))')
          .order('created_at', { ascending: false })
        if (startISO) q = q.gte('created_at', startISO)
        if (endISO) q = q.lt('created_at', endISO)
        const { data: bookings } = await q

        const bookingsData = (bookings || []).map(b => ({
          'Date': new Date(b.created_at).toLocaleDateString('en-GB'),
          'Client Name': (b.client as any)?.full_name || '—',
          'Phone': (b.client as any)?.phone || '—',
          'Class': (b.session as any)?.class_type?.name || '—',
          'Class Date': b.session ? new Date((b.session as any).start_time).toLocaleDateString('en-GB') : '—',
          'Class Time': b.session ? new Date((b.session as any).start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—',
          'Status': b.status,
        }))

        const ws = XLSX.utils.json_to_sheet(bookingsData)
        ws['!cols'] = [
          { wch: 12 }, { wch: 20 }, { wch: 16 },
          { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        ]
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
      }

      if (type === 'payments' || type === 'full') {
        let q = supabase
          .from('payments')
          .select('amount, gateway, status, created_at, client:users(full_name, phone), package:packages(name)')
          .order('created_at', { ascending: false })
        if (startISO) q = q.gte('created_at', startISO)
        if (endISO) q = q.lt('created_at', endISO)
        const { data: payments } = await q

        const paymentsData = (payments || []).map(p => ({
          'Date': new Date(p.created_at).toLocaleDateString('en-GB'),
          'Client Name': (p.client as any)?.full_name || '—',
          'Phone': (p.client as any)?.phone || '—',
          'Package': (p.package as any)?.name || '—',
          'Amount (EGP)': p.amount,
          'Gateway': p.gateway || '—',
          'Status': p.status,
        }))

        const ws = XLSX.utils.json_to_sheet(paymentsData)
        ws['!cols'] = [
          { wch: 12 }, { wch: 20 }, { wch: 16 },
          { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
        ]
        XLSX.utils.book_append_sheet(wb, ws, 'Revenue')
      }

      // ── Download ──────────────────────────────────────────
      const date = new Date().toISOString().slice(0, 10)
      const filename = `AlignWithEnjy_${type === 'full' ? 'FullReport' : type.charAt(0).toUpperCase() + type.slice(1)}_${rangeLabel()}_${date}.xlsx`
      XLSX.writeFile(wb, filename)

      setDone(type)
      setTimeout(() => setDone(null), 3000)
    } catch (e) {
      console.error(e)
    }
    setLoading(null)
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Export Reports</h1>
            <p className="text-xs text-muted-foreground">Download Excel files for analysis</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-3">
        {/* Date range filter */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Date range</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'all', label: 'All time' },
              { id: 'this_month', label: 'This month' },
              { id: 'last_month', label: 'Last month' },
              { id: 'custom', label: 'Custom' },
            ] as { id: RangeId; label: string }[]).map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  range === r.id
                    ? 'bg-[#006D77] text-white border-[#006D77]'
                    : 'bg-background text-foreground border-border hover:bg-muted/40'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          {range === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <input type="date" value={customFrom} max={customTo || undefined}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <input type="date" value={customTo} min={customFrom || undefined}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            Applies to Bookings & Revenue. The Clients report always shows current package balances.
          </p>
        </div>
        {options.map(opt => (
          <button key={opt.id} onClick={() => handleExport(opt.id)}
            disabled={loading !== null}
            className="w-full bg-white border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all disabled:opacity-60 text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#E0EEF0] flex items-center justify-center shrink-0">
              {done === opt.id
                ? <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
                : loading === opt.id
                ? <Loader2 className="w-6 h-6 text-[#006D77] animate-spin" />
                : <opt.icon className={`w-6 h-6 ${opt.color}`} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            {done !== opt.id && loading !== opt.id && (
              <Download className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            {done === opt.id && (
              <span className="text-xs font-semibold text-[#4CAF50] shrink-0">Downloaded!</span>
            )}
          </button>
        ))}

        {/* Info */}
        <div className="bg-[#E0EEF0] rounded-2xl p-4 mt-4">
          <p className="text-xs font-semibold text-[#006D77] mb-1">What's included</p>
          <ul className="space-y-1">
            {[
              'Clients: name, phone, package, sessions used/remaining, attendance rate',
              'Bookings: client, class name, date, time, status (confirmed/attended/no-show)',
              'Revenue: client, package, amount, payment method, date',
            ].map(item => (
              <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-[#006D77] mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
