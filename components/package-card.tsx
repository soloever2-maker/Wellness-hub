'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type ClientPackage = {
  sessions_remaining: number
  sessions_total: number
  expiry_date: string
  status: string
  package: { name: string }
}

export function PackageCard() {
  const [pkg, setPkg] = useState<ClientPackage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const user = await getCurrentUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('client_packages')
        .select('sessions_remaining, sessions_total, expiry_date, status, package:packages(name)')
        .eq('client_id', user.id)
        .in('status', ['active', 'frozen'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) setPkg(data as unknown as ClientPackage)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="h-40 bg-gradient-to-r from-[#006D77] to-[#E86500] rounded-2xl animate-pulse" />
  }

  // No package → CTA
  if (!pkg) {
    return (
      <Link href="/packages" className="block">
        <div className="bg-gradient-to-r from-[#006D77] to-[#E86500] rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">No Active Package</h2>
              <p className="text-sm text-white/80 mt-1">Tap to browse packages & start booking</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const sessionsUsed = pkg.sessions_total - pkg.sessions_remaining
  const progress = (sessionsUsed / pkg.sessions_total) * 100

  return (
    <Link href="/my-package" className="block">
      <div className={`rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow ${
        pkg.status === 'frozen'
          ? 'bg-gradient-to-r from-[#5C6B6E] to-[#5C6B6E]/80'
          : 'bg-gradient-to-r from-[#006D77] to-[#E86500]'
      }`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-white/80">
              {pkg.status === 'frozen' ? '❄️ Frozen' : 'Your Package'}
            </p>
            <h2 className="text-2xl font-bold mt-1">{pkg.package?.name || `${pkg.sessions_total} Classes`}</h2>
          </div>
          <div className="flex items-center justify-center w-24 h-24 relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${(45 * 2 * Math.PI * progress) / 100} ${45 * 2 * Math.PI}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{pkg.sessions_remaining}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">{sessionsUsed} sessions used</span>
            <span className="text-white/80">{pkg.sessions_remaining} remaining</span>
          </div>
          <p className="text-sm font-medium text-white/80">
            Expires {new Date(pkg.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </Link>
  )
}
