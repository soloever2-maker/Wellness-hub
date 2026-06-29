'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, MapPin, Calendar, Users, Edit2, Trash2,
  Globe, EyeOff, Loader2, Copy, CheckCircle, Bell, ChevronLeft, X, Check,
} from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'

type Retreat = {
  id: string
  title: string
  description: string
  location: string
  date: string
  end_date: string | null
  price: number | null
  capacity: number | null
  cover_image: string | null
  status: 'draft' | 'published'
  created_at: string
}

type FormData = {
  title: string
  description: string
  location: string
  date: string
  end_date: string
  price: string
  capacity: string
  cover_image: string
  status: 'draft' | 'published'
}

const EMPTY_FORM: FormData = {
  title: '', description: '', location: '',
  date: '', end_date: '', price: '', capacity: '',
  cover_image: '', status: 'draft',
}

export default function AdminRetreatsPage() {
  const router = useRouter()
  const [retreats,     setRetreats]     = useState<Retreat[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [form,         setForm]         = useState<FormData>(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [notifying,    setNotifying]    = useState<string | null>(null)
  const [copiedId,     setCopiedId]     = useState<string | null>(null)
  const [notifyDone,   setNotifyDone]   = useState<string | null>(null)

  const fetchRetreats = async () => {
    const { data } = await supabase
      .from('retreats')
      .select('*')
      .order('date', { ascending: true })
    if (data) setRetreats(data)
    setLoading(false)
  }

  useEffect(() => { fetchRetreats() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (r: Retreat) => {
    setEditingId(r.id)
    setForm({
      title:       r.title       || '',
      description: r.description || '',
      location:    r.location    || '',
      date:        r.date ? r.date.split('T')[0] : '',
      end_date:    r.end_date ? r.end_date.split('T')[0] : '',
      price:       r.price    != null ? String(r.price)    : '',
      capacity:    r.capacity != null ? String(r.capacity) : '',
      cover_image: r.cover_image || '',
      status:      r.status,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) return
    setSaving(true)

    const wasPublished = editingId
      ? retreats.find(r => r.id === editingId)?.status === 'published'
      : false

    const payload = {
      title:       form.title,
      description: form.description || null,
      location:    form.location    || null,
      date:        form.date,
      end_date:    form.end_date    || null,
      price:       form.price       ? parseFloat(form.price)   : null,
      capacity:    form.capacity    ? parseInt(form.capacity)   : null,
      cover_image: form.cover_image || null,
      status:      form.status,
    }

    let savedId = editingId
    if (editingId) {
      await supabase.from('retreats').update(payload).eq('id', editingId)
    } else {
      const { data } = await supabase.from('retreats').insert(payload).select('id').single()
      savedId = data?.id ?? null
    }

    // Auto-notify all clients if newly published
    if (form.status === 'published' && !wasPublished && savedId) {
      await sendNotification(savedId, form.title, true)
    }

    await fetchRetreats()
    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this retreat?')) return
    setDeleting(id)
    await supabase.from('retreats').delete().eq('id', id)
    await fetchRetreats()
    setDeleting(null)
  }

  const sendNotification = async (id: string, title: string, silent = false) => {
    if (!silent) setNotifying(id)
    try {
      // Get all client IDs
      const { data: clients } = await supabase
        .from('users').select('id').eq('role', 'client').eq('status', 'approved')
      const clientIds = clients?.map(c => c.id) ?? []
      if (!clientIds.length) return

      await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds,
          title: '✨ New Retreat Announced',
          body: title,
          data: { type: 'retreat', retreatId: id },
        }),
      })

      if (!silent) {
        setNotifyDone(id)
        setTimeout(() => setNotifyDone(null), 3000)
      }
    } finally {
      if (!silent) setNotifying(null)
    }
  }

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/retreats/${id}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <main className="bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-bold text-foreground">Retreats</h1>
            <p className="text-xs text-muted-foreground">{retreats.length} retreats</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#006D77] text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : retreats.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No retreats yet</p>
            <p className="text-sm text-muted-foreground">Tap "New" to create your first retreat.</p>
          </div>
        ) : (
          retreats.map(r => (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              {/* Status + Title */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground">{r.title}</h3>
                  {r.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />{r.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(r)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"
                  >
                    {deleting === r.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      : <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    }
                  </button>
                </div>
              </div>

              {/* Actions */}
              {r.status === 'published' && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  {/* Copy Link */}
                  <button
                    onClick={() => copyLink(r.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border rounded-xl text-xs font-medium text-foreground active:scale-[0.97] transition-all"
                  >
                    {copiedId === r.id
                      ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                      : <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                    }
                  </button>

                  {/* Notify */}
                  <button
                    onClick={() => sendNotification(r.id, r.title)}
                    disabled={notifying === r.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#006D77]/10 border border-[#006D77]/20 rounded-xl text-xs font-medium text-[#006D77] active:scale-[0.97] transition-all"
                  >
                    {notifying === r.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : notifyDone === r.id
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Sent!</>
                      : <><Bell className="w-3.5 h-3.5" /> Notify All</>
                    }
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-background w-full rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-foreground">{editingId ? 'Edit Retreat' : 'New Retreat'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4 pb-8">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Sinai Sound Healing Retreat"
                  className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell participants what to expect..."
                  rows={4}
                  className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Dahab, South Sinai"
                  className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Start Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                  />
                </div>
              </div>

              {/* Price + Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Price (EGP)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Capacity</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    placeholder="e.g. 20"
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                  />
                </div>
              </div>

              {/* Cover image URL */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Cover Image URL</label>
                <input
                  value={form.cover_image}
                  onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Status</label>
                <div className="flex gap-3">
                  {(['draft', 'published'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                        form.status === s
                          ? s === 'published'
                            ? 'bg-[#006D77] text-white border-[#006D77]'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-background text-muted-foreground border-border'
                      }`}
                    >
                      {s === 'published' ? '🌐 Published' : '📝 Draft'}
                    </button>
                  ))}
                </div>
                {form.status === 'published' && !editingId && (
                  <p className="text-xs text-[#006D77] mt-2 text-center">
                    ✨ Clients will be notified automatically when you save
                  </p>
                )}
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.date}
                className="w-full py-3.5 bg-[#006D77] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Retreat'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="more" />
    </main>
  )
}
