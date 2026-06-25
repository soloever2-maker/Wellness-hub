'use client'

import { useState } from 'react'
import { ArrowLeft, Snowflake, RefreshCw, Check, X, Calendar, Package, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

const sessionHistory = [
  { date: 'June 22', className: 'Power Yoga', status: 'attended' as const },
  { date: 'June 20', className: 'Mat Pilates', status: 'attended' as const },
  { date: 'June 18', className: 'Gentle Yoga', status: 'no_show' as const },
  { date: 'June 15', className: 'Power Yoga', status: 'attended' as const },
  { date: 'June 13', className: 'Belly Dancing', status: 'attended' as const },
]

export default function MyPackagePage() {
  const [hasPackage, setHasPackage] = useState(true)
  const sessionsUsed = 3
  const sessionsTotal = 8
  const sessionsRemaining = sessionsTotal - sessionsUsed
  const progress = (sessionsRemaining / sessionsTotal) * 100
  const circumference = 45 * 2 * Math.PI

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">My Package</h1>
        <button
          onClick={() => setHasPackage(!hasPackage)}
          className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
        >
          {hasPackage ? 'No Pkg' : 'Has Pkg'}
        </button>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {hasPackage ? (
          <>
            {/* Hero Card */}
            <div className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold">{sessionsTotal} Classes</p>
                <span className="text-xs px-3 py-1 bg-white/20 rounded-full font-medium">Active</span>
              </div>

              <div className="flex items-center justify-center my-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="3" opacity="0.2" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="4"
                      strokeDasharray={`${(circumference * progress) / 100} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{sessionsRemaining}</span>
                    <span className="text-xs text-white/80">remaining</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-white/80">Expires Aug 15, 2026</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: CheckCircle, label: 'Used', value: sessionsUsed, color: 'text-[#D63384]' },
                { icon: Package, label: 'Remaining', value: sessionsRemaining, color: 'text-[#7B2D8E]' },
                { icon: Calendar, label: 'Days Left', value: 28, color: 'text-[#D63384]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-border rounded-xl p-4 text-center shadow-sm">
                  <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[#D63384] text-[#D63384] font-medium hover:bg-[#D63384]/5 transition-colors">
                <Snowflake className="w-4 h-4" />
                Freeze
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D63384] text-white font-medium hover:bg-[#AD1457] transition-colors">
                <RefreshCw className="w-4 h-4" />
                Renew
              </button>
            </div>

            {/* Session History */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Session History</h3>
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {sessionHistory.map((session, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < sessionHistory.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="text-sm text-muted-foreground w-20">{session.date}</span>
                    <span className="text-sm font-medium text-foreground flex-1">{session.className}</span>
                    {session.status === 'attended' ? (
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Package</h3>
            <p className="text-sm text-muted-foreground mb-6">Your last package expired on June 1, 2026</p>
            <Link href="/packages" className="px-8 py-3 bg-[#D63384] text-white font-medium rounded-xl hover:bg-[#AD1457] transition-colors">
              Browse Packages
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
