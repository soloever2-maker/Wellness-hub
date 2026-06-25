'use client'

import Link from 'next/link'

export function PackageCard() {
  const sessionsUsed = 3
  const sessionsTotal = 8
  const progress = (sessionsUsed / sessionsTotal) * 100

  return (
    <Link href="/my-package" className="block">
      <div className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-white/80">Your Package</p>
            <h2 className="text-2xl font-bold mt-1">{sessionsTotal} Classes</h2>
          </div>
          <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white/30 relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${(45 * 2 * Math.PI * progress) / 100} ${45 * 2 * Math.PI}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{sessionsTotal - sessionsUsed}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">{sessionsUsed} sessions used</span>
            <span className="text-white/80">{sessionsTotal - sessionsUsed} remaining</span>
          </div>
          <p className="text-sm font-medium text-white/80">Expires Aug 15, 2026</p>
        </div>
      </div>
    </Link>
  )
}
