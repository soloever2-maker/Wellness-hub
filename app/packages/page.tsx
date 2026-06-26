'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Star, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
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

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setPackages(data)
        setLoading(false)
      })
  }, [])

  const handleBuy = async (pkg: Package) => {
    setBuying(pkg.id)
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Create a pending payment record
      await supabase.from('payments').insert({
        client_id: user.id,
        package_id: pkg.id,
        amount: pkg.price,
        method: 'pending',
        status: 'pending',
      })

      setSuccess(true)
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
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Packages</h1>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mx-4 mt-4 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-[#4CAF50]">Request sent! Enjy will activate your package after payment ✓</p>
          <button onClick={() => setSuccess(false)} className="text-xs text-muted-foreground mt-1">Dismiss</button>
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
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#E86500] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-6">{pkg.name}</h3>

                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#006D77] to-[#E86500] flex items-center justify-center shadow-md">
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
                  disabled={buying === pkg.id}
                  className="w-full flex items-center justify-center gap-2 bg-[#006D77] hover:bg-[#004E5C] text-white py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-60"
                >
                  {buying === pkg.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
