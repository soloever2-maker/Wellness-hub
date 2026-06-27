'use client'

import { useState } from 'react'
import { Filter, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

export default function AdminPaymentsPage() {
  const [activeFilter, setActiveFilter] = useState('All')

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {['All', 'Paid', 'Failed'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-[#006D77] text-white'
                  : 'bg-white border border-border text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="px-4 pt-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
          <CreditCard className="w-10 h-10 text-[#006D77]/40" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Payments Yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Payments will appear here once clients purchase packages through the app or when you record manual payments.
        </p>
      </div>

      <AdminBottomNav activePage="more" />
    </main>
  )
}
