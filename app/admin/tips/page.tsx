'use client'

// ── Admin: Enjy's Tips ─────────────────────────────────────────
// Manage the tips library shown to clients on the /prepare screen.
// Writes go through /api/admin/tips (the tips table is RLS-protected).

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, X, Loader2, Pencil, Trash2,
  Lightbulb, AlertCircle,
} from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type Tip = {
  id: string
  category: string
  text: string
  is_active: boolean
  sort_order: number
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  hydration: { label: 'Hydration', emoji: '💧' },
  food:      { label: 'Food & Timing', emoji: '🍽️' },
  prep:      { label: 'Getting Ready', emoji: '🧘‍♀️' },
  breath:    { label: 'Breath', emoji: '🌬️' },
  practice:  { label: 'During Practice', emoji: '🦶' },
  recovery:  { label: 'Recovery', emoji: '🌙' },
  mindset:   { label: 'Mindset', emoji: '✨' },
}
const CATEGORIES = Object.keys(CATEGORY_META)

async function apiCall(method: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch('/api/admin/tips', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

export default function AdminTipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Tip | null>(null)
  const [form, setForm] = useState({ category: 'hydration', text: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Tip | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTips = async () => {
    try {
      const { tips } = await apiCall('GET')
      setTips(tips || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTips() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ category: 'hydration', text: '' })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (tip: Tip) => {
    setEditing(tip)
    setForm({ category: tip.category, text: tip.text })
    setError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.text.trim()) { setError('Tip text is required.'); return }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await apiCall('PUT', { id: editing.id, category: form.category, text: form.text })
      } else {
        await apiCall('POST', { category: form.category, text: form.text })
      }
      setShowModal(false)
      await fetchTips()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (tip: Tip) => {
    setTogglingId(tip.id)
    try {
      await apiCall('PUT', { id: tip.id, is_active: !tip.is_active })
      setTips(prev => prev.map(t => t.id === tip.id ? { ...t, is_active: !t.is_active } : t))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await apiCall('DELETE', { id: confirmDelete.id })
      setTips(prev => prev.filter(t => t.id !== confirmDelete.id))
      setConfirmDelete(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const visible = filter === 'all' ? tips : tips.filter(t => t.category === filter)
  const activeCount = tips.filter(t => t.is_active).length

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Enjy&apos;s Tips</h1>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          These tips appear to your clients on their pre-class screen.
          {tips.length > 0 && ` ${activeCount} of ${tips.length} are active.`}
        </p>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
          <button onClick={() => setFilter('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === 'all' ? 'bg-[#006D77] text-white border-[#006D77]' : 'bg-white text-foreground border-border'
            }`}>
            All
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === cat ? 'bg-[#006D77] text-white border-[#006D77]' : 'bg-white text-foreground border-border'
              }`}>
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </button>
          ))}
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
              <Lightbulb className="w-8 h-8 text-[#006D77]/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No tips here yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap the + button to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(tip => (
              <div key={tip.id}
                className={`bg-white border border-border rounded-2xl p-4 shadow-sm ${!tip.is_active ? 'opacity-55' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDD7C9]/30 flex items-center justify-center flex-shrink-0 text-lg">
                    {CATEGORY_META[tip.category]?.emoji || '💡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#B8612A] uppercase tracking-wide mb-0.5">
                      {CATEGORY_META[tip.category]?.label || tip.category}
                      {!tip.is_active && ' · Hidden'}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 justify-end">
                  {/* Active toggle */}
                  <button onClick={() => handleToggle(tip)} disabled={togglingId === tip.id}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center transition-colors disabled:opacity-60 ${
                      tip.is_active ? 'bg-[#E0EEF0] text-[#006D77]' : 'bg-muted text-muted-foreground'
                    }`}>
                    {togglingId === tip.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : tip.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button onClick={() => openEdit(tip)}
                    className="w-9 h-9 rounded-xl bg-[#E0EEF0] flex items-center justify-center hover:bg-[#cfe5e8] transition-colors">
                    <Pencil className="w-4 h-4 text-[#006D77]" />
                  </button>
                  <button onClick={() => { setError(null); setConfirmDelete(tip) }}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#006D77] text-white shadow-lg flex items-center justify-center hover:bg-[#004E5C] transition-colors">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-end" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-28 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{editing ? 'Edit Tip' : 'Add Tip'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.category === cat ? 'bg-[#006D77] text-white border-[#006D77]' : 'bg-white text-foreground border-border'
                    }`}>
                    {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tip text</label>
              <textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                rows={4}
                placeholder="e.g. Sip water throughout the day — don't chug a bottle right before class."
                className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
              />
              <p className="text-xs text-muted-foreground mt-1">Keep it short and warm — one or two sentences.</p>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-full bg-[#006D77] text-white text-sm font-semibold hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Tip'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center px-6" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white w-full rounded-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Delete this tip?</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-5">&ldquo;{confirmDelete.text}&rdquo;</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-full border border-border text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deletingId === confirmDelete.id}
                className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingId === confirmDelete.id && <Loader2 className="w-4 h-4 animate-spin" />}
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
