// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/my-package/page.tsx
// (زرار Renew بقى اسمه View Packages (أوضح))
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Snowflake, RefreshCw, Check, X, Calendar, Package, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type ClientPackage = {
  id: string
  sessions_remaining: number
  sessions_total: number
  expiry_date: string
  status: string
  freeze_start: string | null
  package: { name: string }
}

type BookingHistory = {
  id: string
  status: string
  booked_at: string
  session: {
    start_time: string
    class_type: { name: string }
  }
}

export default function MyPackagePage() {
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<ClientPackage | null>(null)
  const [history, setHistory] = useState<BookingHistory[]>([])
  const [freezing, setFreezing] = useState(false)
  const [maxFreezeDays, setMaxFreezeDays] = useState<number | null>(null)

  useEffect(() => {
    // Enjy's freeze cap (admin setting). null = no cap configured.
    supabase.from('settings').select('value').eq('key', 'max_freeze_days').maybeSingle()
      .then(({ data }) => {
        const d = parseInt(data?.value)
        if (!isNaN(d) && d > 0) setMaxFreezeDays(d)
      })
  }, [])
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      // Get active package
      const { data: pkgData } = await supabase
        .from('client_packages')
        .select('*, package:packages(name)')
        .eq('client_id', user.id)
        .in('status', ['active', 'frozen'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (pkgData) setPkg(pkgData as unknown as ClientPackage)

      // Get booking history
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, status, booked_at, session:class_sessions(start_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .in('status', ['attended', 'no_show'])
        .order('booked_at', { ascending: false })
        .limit(10)

      if (bookings) setHistory(bookings as unknown as BookingHistory[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleFreeze = async () => {
    if (!pkg) return
    setFreezing(true)
    try {
      if (pkg.status === 'frozen') {
        // Unfreeze — extend expiry by frozen days (capped by Enjy's max)
        let frozenDays = pkg.freeze_start
          ? Math.ceil((Date.now() - new Date(pkg.freeze_start).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        if (maxFreezeDays !== null) frozenDays = Math.min(frozenDays, maxFreezeDays)
        const newExpiry = new Date(pkg.expiry_date)
        newExpiry.setDate(newExpiry.getDate() + frozenDays)

        await supabase
          .from('client_packages')
          .update({ status: 'active', freeze_start: null, freeze_end: new Date().toISOString(), expiry_date: newExpiry.toISOString() })
          .eq('id', pkg.id)

        setPkg({ ...pkg, status: 'active', freeze_start: null, expiry_date: newExpiry.toISOString() })
      } else {
        // Freeze
        await supabase
          .from('client_packages')
          .update({ status: 'frozen', freeze_start: new Date().toISOString() })
          .eq('id', pkg.id)

        setPkg({ ...pkg, status: 'frozen', freeze_start: new Date().toISOString() })
      }
    } catch { /* silent */ }
    setFreezing(false)
  }

  const handleCancelPackage = async () => {
    if (!pkg) return
    setCancelling(true)
    try {
      // Expire the package
      await supabase.from('client_packages').update({ status: 'expired' }).eq('id', pkg.id)

      // Mark the most recent paid payment as refunded
      const user = await import('@/lib/auth').then(m => m.getCurrentUser())
      if (user) {
        const { data: paidPmt } = await supabase.from('payments')
          .select('id').eq('client_id', user.id).eq('status', 'paid')
          .order('paid_at', { ascending: false }).limit(1).maybeSingle()
        if (paidPmt) {
          await supabase.from('payments').update({ status: 'refunded' }).eq('id', paidPmt.id)
        }
      }
      setPkg(null)
    } catch (err) {
      console.error('Cancel package failed:', err)
    }
    setCancelling(false)
    setShowCancelConfirm(false)
  }

  const daysLeft = pkg ? Math.max(0, Math.ceil((new Date(pkg.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  const sessionsUsed = pkg ? pkg.sessions_total - pkg.sessions_remaining : 0
  const progress = pkg ? (pkg.sessions_remaining / pkg.sessions_total) * 100 : 0
  const circumference = 45 * 2 * Math.PI

  if (loading) {
    return (
      <main className="bg-background min-h-screen pb-24 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">My Package</h1>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {pkg ? (
          <>
            {/* Hero Card */}
            <div className={`rounded-2xl p-6 text-white shadow-lg ${
              pkg.status === 'frozen' 
                ? 'bg-gradient-to-r from-[#5C6B6E] to-[#5C6B6E]/80' 
                : 'bg-gradient-to-r from-[#006D77] to-[#B8612A]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold">{pkg.package?.name || `${pkg.sessions_total} Classes`}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  pkg.status === 'frozen' ? 'bg-white/30' : 'bg-white/20'
                }`}>
                  {pkg.status === 'frozen' ? '❄️ Frozen' : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-center my-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="4"
                      strokeDasharray={`${(circumference * progress) / 100} ${circumference}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{pkg.sessions_remaining}</span>
                    <span className="text-xs text-white/80">remaining</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-white/80">
                Expires {new Date(pkg.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: CheckCircle, label: 'Used', value: sessionsUsed, color: 'text-[#006D77]' },
                { icon: Package, label: 'Remaining', value: pkg.sessions_remaining, color: 'text-[#B8612A]' },
                { icon: Calendar, label: 'Days Left', value: daysLeft, color: 'text-[#006D77]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Book Now CTA */}
            {pkg.status === 'active' && pkg.sessions_remaining > 0 && (
              <a href="/schedule"
                className="flex items-center gap-3 p-4 rounded-2xl mb-1 active:scale-[0.97] transition-all"
                style={{ background: 'linear-gradient(135deg, #006D77, #004E5C)' }}>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-xl">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm leading-tight">
                    You have {pkg.sessions_remaining} sessions ready!
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">Tap to book your first class →</p>
                </div>
              </a>
            )}

            {/* Freeze policy note */}
            {maxFreezeDays !== null && (
              <p className="text-[11px] text-muted-foreground mb-2">
                ❄️ Freeze pauses your package expiry — up to {maxFreezeDays} days per freeze.
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleFreeze}
                disabled={freezing}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 ${
                  pkg.status === 'frozen'
                    ? 'bg-[#006D77] text-white hover:bg-[#004E5C]'
                    : 'border-2 border-[#006D77] text-[#006D77] hover:bg-[#006D77]/5'
                }`}
              >
                {freezing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Snowflake className="w-4 h-4" />}
                {pkg.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
              </button>
              <Link href="/packages"
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#006D77] text-white font-medium text-sm hover:bg-[#004E5C] transition-colors">
                <RefreshCw className="w-4 h-4" />
                View Packages
              </Link>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-[#E53935]/40 text-[#E53935] font-medium text-sm hover:bg-[#E53935]/5 transition-colors">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>

            {/* Session History */}
            {history.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Session History</h3>
                <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                  {history.map((booking, i) => (
                    <div key={booking.id} className={`flex items-center justify-between px-4 py-3 ${i < history.length - 1 ? 'border-b border-border' : ''}`}>
                      <span className="text-sm text-muted-foreground w-20">
                        {new Date(booking.session?.start_time || booking.booked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {booking.session?.class_type?.name || 'Class'}
                      </span>
                      {booking.status === 'attended' ? (
                        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full">
                          <Check className="w-3 h-3" /> Attended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-[#E53935]/10 text-[#E53935] rounded-full">
                          <X className="w-3 h-3" /> No Show
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* No Package State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Package</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center">Purchase a package to start booking classes</p>
            <Link href="/packages" className="px-8 py-3 bg-[#006D77] text-white font-medium rounded-xl hover:bg-[#004E5C] transition-colors">
              Browse Packages
            </Link>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Cancel Package Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-[#E53935]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-[#E53935]" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center mb-2">Cancel Package?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This will cancel your active package and mark your payment as refunded. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-foreground">
                Keep Package
              </button>
              <button onClick={handleCancelPackage} disabled={cancelling}
                className="flex-1 py-3 bg-[#E53935] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
