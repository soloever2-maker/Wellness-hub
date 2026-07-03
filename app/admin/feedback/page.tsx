'use client'

// ── Admin: Reviews & Feedback ──────────────────────────────────
// Moderate public class reviews (approve/hide/delete) and read
// private suggestions & feedback from clients.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Star, Loader2, Trash2, Check, EyeOff,
  MessageSquare, Lightbulb, AlertCircle,
} from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type ReviewRow = {
  id: string
  type: 'review' | 'suggestion' | 'feedback'
  rating: number | null
  class_type: string | null
  comment: string
  is_approved: boolean
  created_at: string
  client: { full_name: string; phone: string | null } | null
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'reviews' | 'inbox'>('reviews')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ReviewRow | null>(null)

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, type, rating, class_type, comment, is_approved, created_at, client:users(full_name, phone)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRows((data || []) as unknown as ReviewRow[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const setApproved = async (row: ReviewRow, approved: boolean) => {
    setBusyId(row.id)
    const { error } = await supabase.from('reviews').update({ is_approved: approved }).eq('id', row.id)
    if (error) setError(error.message)
    else setRows(prev => prev.map(r => r.id === row.id ? { ...r, is_approved: approved } : r))
    setBusyId(null)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setBusyId(confirmDelete.id)
    const { error } = await supabase.from('reviews').delete().eq('id', confirmDelete.id)
    if (error) setError(error.message)
    else setRows(prev => prev.filter(r => r.id !== confirmDelete.id))
    setBusyId(null)
    setConfirmDelete(null)
  }

  const reviews = rows.filter(r => r.type === 'review')
  const inbox = rows.filter(r => r.type !== 'review')
  const pendingCount = reviews.filter(r => !r.is_approved).length
  const visible = tab === 'reviews' ? reviews : inbox

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Reviews & Feedback</h1>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setTab('reviews')}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              tab === 'reviews' ? 'bg-[#006D77] text-white border-[#006D77]' : 'bg-white text-foreground border-border'
            }`}>
            ⭐ Class Reviews
            {pendingCount > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'reviews' ? 'bg-white/20 text-white' : 'bg-[#B8612A] text-white'}`}>
                {pendingCount} new
              </span>
            )}
          </button>
          <button onClick={() => setTab('inbox')}
            className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              tab === 'inbox' ? 'bg-[#006D77] text-white border-[#006D77]' : 'bg-white text-foreground border-border'
            }`}>
            💌 Suggestions ({inbox.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-3">
              {tab === 'reviews'
                ? <Star className="w-8 h-8 text-[#006D77]/40" />
                : <MessageSquare className="w-8 h-8 text-[#006D77]/40" />}
            </div>
            <p className="text-sm font-medium text-foreground">
              {tab === 'reviews' ? 'No reviews yet' : 'No suggestions yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === 'reviews'
                ? 'Client reviews will land here for your approval.'
                : 'Private suggestions and feedback from clients appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(row => (
              <div key={row.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {row.client?.full_name || 'Unknown client'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {row.client?.phone && ` · ${row.client.phone}`}
                    </p>
                  </div>
                  {row.type === 'review' ? (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= (row.rating || 0) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-border'}`} />
                      ))}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-[#EDD7C9]/40 text-[#B8612A] flex-shrink-0">
                      <Lightbulb className="w-3 h-3" />
                      {row.type === 'suggestion' ? 'Suggestion' : 'Feedback'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {row.class_type && (
                    <span className="text-[10px] font-semibold text-[#006D77] bg-[#E0EEF0] px-2 py-0.5 rounded-full">
                      {row.class_type}
                    </span>
                  )}
                  {row.type === 'review' && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      row.is_approved ? 'bg-green-50 text-green-600' : 'bg-[#EDD7C9]/40 text-[#B8612A]'
                    }`}>
                      {row.is_approved ? '● Live for clients' : '○ Pending approval'}
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground leading-relaxed">{row.comment}</p>

                <div className="flex items-center gap-1.5 mt-3 justify-end">
                  {row.type === 'review' && (
                    row.is_approved ? (
                      <button onClick={() => setApproved(row, false)} disabled={busyId === row.id}
                        className="h-9 px-3 rounded-xl bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60">
                        {busyId === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                        Hide
                      </button>
                    ) : (
                      <button onClick={() => setApproved(row, true)} disabled={busyId === row.id}
                        className="h-9 px-3 rounded-xl bg-[#006D77] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60">
                        {busyId === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    )
                  )}
                  <button onClick={() => setConfirmDelete(row)}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center px-6" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white w-full rounded-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Delete this {confirmDelete.type}?</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-5">&ldquo;{confirmDelete.comment}&rdquo;</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-full border border-border text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={busyId === confirmDelete.id}
                className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {busyId === confirmDelete.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav />
    </main>
  )
}
