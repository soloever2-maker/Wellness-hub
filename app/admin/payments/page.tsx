'use client'

import { useState, useEffect } from 'react'
import { CreditCard, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'
import { ConfirmModal } from '@/components/confirm-modal'
import Link from 'next/link'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'

type Payment = {
  id: string
  amount: number
  gateway: string
  status: string
  paid_at: string
  created_at: string
  client: { full_name: string; phone: string }
  package: { name: string }
}

const filters = ['All', 'Paid', 'Pending', 'Refunded']

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [total, setTotal] = useState(0)
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('payments')
      .select('id, amount, gateway, status, paid_at, created_at, client:users(full_name, phone), package:packages(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setPayments(data as unknown as Payment[])
          const paid = data.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)
          setTotal(paid)
        }
        setLoading(false)
      })
  }, [])

  const handleRefund = async (paymentId: string) => {
    setConfirmRefundId(null)
    setRefundingId(paymentId)
    const { error } = await supabase.from('payments')
      .update({ status: 'refunded' })
      .eq('id', paymentId)
    if (error) {
      alert('Refund failed: ' + error.message)
    } else {
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'refunded' } : p))
      setTotal(prev => {
        const pmt = payments.find(p => p.id === paymentId)
        return pmt ? prev - (pmt.amount || 0) : prev
      })
    }
    setRefundingId(null)
  }

  const filtered = payments.filter(p =>
    activeFilter === 'All' ? true :
    activeFilter === 'Paid' ? p.status === 'paid' :
    activeFilter === 'Refunded' ? p.status === 'refunded' :
    p.status === 'pending'
  )

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Payments</h1>
            {total > 0 && <p className="text-xs text-muted-foreground">Total: {total.toLocaleString()} EGP</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === f ? 'bg-[#006D77] text-white' : 'bg-white border border-border text-foreground'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <CreditCard className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No payments yet</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{(p.client as any)?.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{(p.package as any)?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {p.gateway && ` · ${p.gateway}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="font-bold text-foreground">{(p.amount || 0).toLocaleString()} EGP</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'paid'     ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
                    p.status === 'refunded' ? 'bg-[#E53935]/10 text-[#E53935]' :
                                              'bg-[#FF9800]/10 text-[#FF9800]'
                  }`}>{p.status}</span>
                  {p.status === 'paid' && (
                    <button
                      onClick={() => setConfirmRefundId(p.id)}
                      disabled={refundingId === p.id}
                      className="flex items-center gap-1 text-xs font-medium text-[#E53935] border border-[#E53935]/30 px-2.5 py-1 rounded-full hover:bg-[#E53935]/5 transition-colors disabled:opacity-50"
                    >
                      {refundingId === p.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RotateCcw className="w-3 h-3" />}
                      Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminBottomNav activePage="more" />

      <ConfirmModal
        open={!!confirmRefundId}
        title="Refund Payment?"
        message="This will mark the payment as refunded. This action cannot be undone."
        confirmLabel="Yes, Refund"
        destructive
        loading={!!refundingId}
        onCancel={() => setConfirmRefundId(null)}
        onConfirm={() => confirmRefundId && handleRefund(confirmRefundId)}
      />
    </main>
  )
}
