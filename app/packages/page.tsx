// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/packages/page.tsx
// (العميل يشوف كل الباكدجات بأسعارها، بس ميقدرش يطلب جديدة
//  لحد ما يخلّص حصص الباكدج الحالية)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Star, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type Package = {
  id: string
  name: string
  session_count: number
  validity_days: number
  price: number
  display_order: number
}

type PendingRequest = {
  id: string
  package_id: string
  package: { name: string } | null
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null)
  const [activePackageId, setActivePackageId] = useState<string | null>(null)
  const [hasActiveBalance, setHasActiveBalance] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [pkgsRes, userRes] = await Promise.all([
        supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
        getCurrentUser(),
      ])
      if (pkgsRes.data) setPackages(pkgsRes.data)

      if (userRes) {
        const [pendingRes, activePkgRes] = await Promise.all([
          supabase
            .from('payments')
            .select('id, package_id, package:packages(name)')
            .eq('client_id', userRes.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('client_packages')
            .select('package_id, sessions_remaining')
            .eq('client_id', userRes.id)
            .in('status', ['active', 'frozen'])
            .gt('sessions_remaining', 0)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        if (pendingRes.data) setPendingRequest(pendingRes.data as unknown as PendingRequest)
        if (activePkgRes.data) {
          setActivePackageId(activePkgRes.data.package_id)
          setHasActiveBalance(true)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleBuy = async (pkg: Package) => {
    // Guard 1: already have a request waiting for admin confirmation
    if (pendingRequest) return
    // Guard 2: still has sessions left in an active package — can't request a new
    // one until the current balance is used up
    if (hasActiveBalance) return

    setBuying(pkg.id)
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { data: stillPending } = await supabase
        .from('payments')
        .select('id, package_id, package:packages(name)')
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (stillPending) {
        setPendingRequest(stillPending as unknown as PendingRequest)
        setBuying(null)
        return
      }

      const { data: stillActive } = await supabase
        .from('client_packages')
        .select('package_id')
        .eq('client_id', user.id)
        .in('status', ['active', 'frozen'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (stillActive?.package_id === pkg.id) {
        setActivePackageId(stillActive.package_id)
        setBuying(null)
        return
      }

      // Create a pending payment record
      const { data: inserted, error: paymentError } = await supabase.from('payments').insert({
        client_id: user.id,
        package_id: pkg.id,
        amount: pkg.price,
        gateway: 'cash',
        status: 'pending',
      }).select('id, package_id, package:packages(name)').single()
      if (paymentError) console.error('Pending payment insert failed:', paymentError)
      if (inserted) setPendingRequest(inserted as unknown as PendingRequest)

      setBuying(null)

      // Open WhatsApp to Enjy with package details
      const msg = encodeURIComponent(
        `Hi Enjy! 🧘‍♀️\nI'd like to purchase the "${pkg.name}" package (${pkg.price} EGP).\nPlease let me know how to pay!`
      )
      window.open(`https://wa.me/201063751653?text=${msg}`, '_blank')
    } catch {
      setBuying(null)
    }
  }

  const popular = packages.find(p => p.session_count === 8)

  return (
    <main className="bg-background min-h-screen pb-24">
      <TopBar />
      <div className="sticky top-14 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Packages</h1>
      </div>

      {/* Active package banner — client still has sessions, can't request a new one yet */}
      {hasActiveBalance && !pendingRequest && (
        <div className="mx-4 mt-4 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-[#2E7D32]">
            You still have an active package with sessions left.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You can browse all packages below. You'll be able to request a new one once your current sessions are used up.
          </p>
        </div>
      )}

      {/* Pending request banner — shown until admin confirms, prevents duplicate requests */}
      {pendingRequest && (
        <div className="mx-4 mt-4 bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-[#B8612A]">
            Request sent for "{pendingRequest.package?.name || 'your package'}" — waiting for Enjy to confirm payment.
          </p>
          <p className="text-xs text-muted-foreground mt-1">You can't send another request until this one is confirmed.</p>
        </div>
      )}

      <div className="px-4 pt-6 pb-8 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : (
          packages.map((pkg) => {
            const isPopular = pkg.id === popular?.id
            return (
              <div key={pkg.id} className="relative bg-white rounded-2xl border border-border p-6 shadow-sm">
                {isPopular && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#B8612A] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-6">{pkg.name}</h3>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#006D77] to-[#B8612A] flex items-center justify-center shadow-md">
                    <span className="text-3xl font-bold text-white">{pkg.session_count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">classes</p>
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-border">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Valid for {pkg.validity_days} days</p>
                </div>

                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-foreground">{pkg.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">EGP</p>
                </div>

                <button
                  onClick={() => handleBuy(pkg)}
                  disabled={buying === pkg.id || !!pendingRequest || hasActiveBalance}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60 ${
                    pkg.id === activePackageId
                      ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-2 border-[#4CAF50]/30'
                      : 'bg-[#006D77] hover:bg-[#004E5C] text-white'
                  }`}
                >
                  {buying === pkg.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : pkg.id === activePackageId ? (
                    'Current Plan'
                  ) : pendingRequest ? (
                    'Request Pending'
                  ) : hasActiveBalance ? (
                    'Finish current package first'
                  ) : (
                    <><MessageCircle className="w-4 h-4" /> Buy Package</>
                  )}
                </button>
              </div>
            )
          })
        )}

        {/* Info note */}
        <div className="bg-[#E0EEF0] rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-[#006D77]">How it works</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tap "Buy Package" to send a purchase request to Enjy via WhatsApp. Once payment is confirmed, your package will be activated in the app.
          </p>
        </div>
      </div>

      <BottomNav activePage="packages" />
    </main>
  )
}
