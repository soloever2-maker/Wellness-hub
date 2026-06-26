'use client'

import { useState } from 'react'
import { ArrowLeft, Download, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

type FilterType = 'all' | 'online' | 'cash'

const summaryCards = [
  { label: 'This Month', value: '15,600 EGP', icon: TrendingUp },
  { label: 'This Week', value: '3,200 EGP', icon: Calendar },
  { label: 'Today', value: '1,200 EGP', icon: DollarSign },
]

const transactions = [
  { id: '1', client: 'Sara Mohamed', package: '8 Classes', amount: '1,200 EGP', method: 'paymob' as const, date: 'June 25, 2026 — 2:30 PM', status: 'paid' as const },
  { id: '2', client: 'Nour Ahmed', package: '4 Classes', amount: '700 EGP', method: 'cash' as const, date: 'June 25, 2026 — 10:15 AM', status: 'paid' as const },
  { id: '3', client: 'Layla Hassan', package: '12 Classes', amount: '1,600 EGP', method: 'paymob' as const, date: 'June 24, 2026 — 6:00 PM', status: 'paid' as const },
  { id: '4', client: 'Mona Khaled', package: 'Drop In', amount: '200 EGP', method: 'cash' as const, date: 'June 24, 2026 — 11:00 AM', status: 'paid' as const },
  { id: '5', client: 'Yasmin Tarek', package: '8 Classes', amount: '1,200 EGP', method: 'paymob' as const, date: 'June 23, 2026 — 3:45 PM', status: 'failed' as const },
  { id: '6', client: 'Hana Ali', package: '4 Classes', amount: '700 EGP', method: 'paymob' as const, date: 'June 23, 2026 — 1:20 PM', status: 'paid' as const },
  { id: '7', client: 'Dina Mostafa', package: '12 Classes', amount: '1,600 EGP', method: 'cash' as const, date: 'June 22, 2026 — 5:30 PM', status: 'paid' as const },
  { id: '8', client: 'Rana Samir', package: 'Drop In', amount: '200 EGP', method: 'paymob' as const, date: 'June 22, 2026 — 9:00 AM', status: 'paid' as const },
  { id: '9', client: 'Farida Nabil', package: '8 Classes', amount: '1,200 EGP', method: 'cash' as const, date: 'June 21, 2026 — 4:15 PM', status: 'paid' as const },
  { id: '10', client: 'Salma Ibrahim', package: '4 Classes', amount: '700 EGP', method: 'paymob' as const, date: 'June 20, 2026 — 12:00 PM', status: 'paid' as const },
]

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.method === (filter === 'online' ? 'paymob' : 'cash')
  })

  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Payments</h1>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#006D77] px-3 py-1.5 border border-[#006D77] rounded-full hover:bg-[#006D77]/5 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white border border-border rounded-2xl p-3 shadow-sm text-center">
              <card.icon className="w-5 h-5 text-[#006D77] mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2">
          {(['all', 'online', 'cash'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-[#006D77] text-white'
                  : 'bg-white border border-border text-foreground hover:bg-[#FFD9B8]/20'
              }`}
            >
              {f === 'all' ? 'All' : f === 'online' ? 'Online' : 'Cash'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="bg-white border border-border rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.client}</p>
                  <p className="text-xs text-muted-foreground">{tx.package}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{tx.amount}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{tx.date}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    tx.method === 'paymob'
                      ? 'bg-[#FFD9B8]/30 text-[#006D77]'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tx.method === 'paymob' ? 'Paymob' : 'Cash'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    tx.status === 'paid'
                      ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                      : 'bg-[#E53935]/10 text-[#E53935]'
                  }`}>
                    {tx.status === 'paid' ? 'Paid \u2713' : 'Failed \u2717'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
