'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, TrendingUp, DollarSign, Plus, ChevronRight, X,
  Check, Loader2, Copy, Edit2, ToggleLeft, ToggleRight,
  ExternalLink, ArrowLeft,
} from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu }        from '@/components/user-menu'
import { supabase }        from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────

type Partner = {
  id: string; name: string; slug: string
  logo_url: string | null; description: string | null
  promo_code: string; discount_type: 'percentage' | 'fixed'
  discount_value: number; is_active: boolean; created_at: string
  // computed
  total_leads?: number; converted_leads?: number; total_revenue?: number
}

type Lead = {
  id: string; partner_id: string; name: string; phone: string
  email: string | null; status: LeadStatus; notes: string | null
  created_at: string; converted_at: string | null; client_id: string | null
}

type LeadStatus = 'new' | 'contacted' | 'converted' | 'cold' | 'lost'

type FormData = {
  name: string; slug: string; promo_code: string
  discount_value: string; logo_url: string; description: string
}

// ─── Config ───────────────────────────────────────────────────────

const STATUS: Record<LeadStatus, { label: string; color: string; dot: string }> = {
  new:       { label: 'New',       color: 'bg-[#006D77]/10 text-[#006D77]',   dot: 'bg-[#006D77]'   },
  contacted: { label: 'Contacted', color: 'bg-[#FF9800]/10 text-[#FF9800]',   dot: 'bg-[#FF9800]'   },
  converted: { label: 'Converted', color: 'bg-[#4CAF50]/10 text-[#4CAF50]',   dot: 'bg-[#4CAF50]'   },
  cold:      { label: 'Cold',      color: 'bg-gray-100 text-gray-400',         dot: 'bg-gray-300'    },
  lost:      { label: 'Lost',      color: 'bg-[#E53935]/10 text-[#E53935]',   dot: 'bg-[#E53935]'   },
}

const STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new:       ['contacted', 'converted', 'cold'],
  contacted: ['converted', 'cold', 'lost'],
  converted: [],
  cold:      ['contacted', 'lost'],
  lost:      ['cold'],
}

// ─── Helpers ──────────────────────────────────────────────────────

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function toPromoCode(s: string, discount: number) {
  return s.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '').slice(0, 8) + discount
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────

export default function AdminPartnersPage() {

  const [partners,      setPartners]      = useState<Partner[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedP,     setSelectedP]     = useState<Partner | null>(null)
  const [leads,         setLeads]         = useState<Lead[]>([])
  const [leadsLoading,  setLeadsLoading]  = useState(false)
  const [showModal,     setShowModal]     = useState(false)
  const [editingP,      setEditingP]      = useState<Partner | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [toast,         setToast]         = useState('')
  const [form, setForm] = useState<FormData>({
    name: '', slug: '', promo_code: '', discount_value: '10', logo_url: '', description: '',
  })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Fetch partners + stats ──────────────────────────────────────
  const fetchPartners = useCallback(async () => {
    setLoading(true)

    const [{ data: pData }, { data: lData }, { data: rData }] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_leads').select('partner_id, status'),
      supabase.from('partner_leads').select('partner_id, client_id').eq('status', 'converted'),
    ])

    if (!pData) { setLoading(false); return }

    // Revenue per partner (sum payments from converted clients)
    const revenueByPartner: Record<string, number> = {}
    if (rData?.length) {
      const clientIds = rData.map(r => r.client_id).filter(Boolean) as string[]
      if (clientIds.length) {
        const { data: payData } = await supabase
          .from('payments').select('client_id, amount').in('client_id', clientIds).eq('status', 'paid')

        const clientToPartner: Record<string, string> = {}
        rData.forEach(r => { if (r.client_id) clientToPartner[r.client_id] = r.partner_id })

        payData?.forEach(p => {
          const pid = clientToPartner[p.client_id]
          if (pid) revenueByPartner[pid] = (revenueByPartner[pid] || 0) + (p.amount || 0)
        })
      }
    }

    // Stats per partner
    const statsMap: Record<string, { total: number; converted: number }> = {}
    lData?.forEach(l => {
      if (!statsMap[l.partner_id]) statsMap[l.partner_id] = { total: 0, converted: 0 }
      statsMap[l.partner_id].total++
      if (l.status === 'converted') statsMap[l.partner_id].converted++
    })

    setPartners(pData.map(p => ({
      ...p,
      total_leads:     statsMap[p.id]?.total     ?? 0,
      converted_leads: statsMap[p.id]?.converted ?? 0,
      total_revenue:   revenueByPartner[p.id]    ?? 0,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchPartners() }, [fetchPartners])

  // ── Open partner leads panel ────────────────────────────────────
  const openPartner = async (p: Partner) => {
    setSelectedP(p)
    setLeadsLoading(true)
    const { data } = await supabase
      .from('partner_leads').select('*').eq('partner_id', p.id)
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLeadsLoading(false)
  }

  // ── Update lead status ──────────────────────────────────────────
  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    await supabase.from('partner_leads').update({
      status: newStatus,
      converted_at: newStatus === 'converted' ? new Date().toISOString() : null,
    }).eq('id', leadId)
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
  }

  // ── Add / Edit modal ────────────────────────────────────────────
  const openAdd = () => {
    setEditingP(null)
    setForm({ name: '', slug: '', promo_code: '', discount_value: '10', logo_url: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (p: Partner) => {
    setEditingP(p)
    setForm({
      name:           p.name,
      slug:           p.slug,
      promo_code:     p.promo_code,
      discount_value: String(p.discount_value),
      logo_url:       p.logo_url  || '',
      description:    p.description || '',
    })
    setShowModal(true)
  }

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev, name,
      ...(!editingP ? {
        slug:       toSlug(name),
        promo_code: toPromoCode(name, Number(prev.discount_value) || 10),
      } : {}),
    }))
  }

  const savePartner = async () => {
    if (!form.name || !form.slug || !form.promo_code) return
    setSaving(true)

    const payload = {
      name:           form.name.trim(),
      slug:           form.slug.toLowerCase().trim(),
      promo_code:     form.promo_code.toUpperCase().trim(),
      discount_type:  'percentage' as const,
      discount_value: parseFloat(form.discount_value) || 10,
      logo_url:       form.logo_url.trim()    || null,
      description:    form.description.trim() || null,
    }

    if (editingP) {
      const { error } = await supabase.from('partners').update(payload).eq('id', editingP.id)
      if (error) { showToast('Error saving — ' + error.message); setSaving(false); return }
      showToast('Partner updated ✓')
    } else {
      const { error } = await supabase.from('partners').insert({ ...payload, is_active: true })
      if (error) { showToast('Error — ' + error.message); setSaving(false); return }
      showToast('Partner added ✓')
    }

    setSaving(false)
    setShowModal(false)
    await fetchPartners()
  }

  const toggleActive = async (p: Partner) => {
    await supabase.from('partners').update({ is_active: !p.is_active }).eq('id', p.id)
    await fetchPartners()
    showToast(p.is_active ? 'Partner deactivated' : 'Partner activated')
  }

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${slug}`)
    showToast('Link copied ✓')
  }

  // ── Summary stats ───────────────────────────────────────────────
  const totalLeads     = partners.reduce((s, p) => s + (p.total_leads     || 0), 0)
  const totalConverted = partners.reduce((s, p) => s + (p.converted_leads || 0), 0)
  const totalRevenue   = partners.reduce((s, p) => s + (p.total_revenue   || 0), 0)

  // ── Render ───────────────────────────────────────────────────────
  return (
    <main className="bg-background min-h-screen pb-24">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Partners</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? '—' : `${partners.length} partner${partners.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu variant="admin" />
            <button
              onClick={openAdd}
              className="w-9 h-9 rounded-full bg-[#006D77] flex items-center justify-center shadow-sm"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* ── Summary stats ── */}
        {!loading && partners.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { Icon: Users,      label: 'Leads',     value: String(totalLeads) },
              { Icon: TrendingUp, label: 'Converted',  value: String(totalConverted) },
              { Icon: DollarSign, label: 'Revenue',    value: totalRevenue ? `${totalRevenue.toLocaleString()} EGP` : '—' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-border rounded-2xl p-3 text-center shadow-sm">
                <s.Icon className="w-4 h-4 text-[#006D77] mx-auto mb-1" />
                <p className="text-base font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Partners list ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#006D77] animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">🤝</p>
            <p className="text-base font-semibold text-foreground">No partners yet</p>
            <p className="text-sm text-muted-foreground">Add your first partner to get started</p>
            <button
              onClick={openAdd}
              className="mt-2 px-6 py-2.5 bg-[#006D77] text-white text-sm font-semibold rounded-xl shadow-sm"
            >
              Add Partner
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map(p => {
              const conv = p.total_leads
                ? Math.round((p.converted_leads || 0) / p.total_leads * 100)
                : 0
              return (
                <div key={p.id} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">

                  {/* Main row */}
                  <button
                    onClick={() => openPartner(p)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-muted/30"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-[#E0EEF0] flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-[#006D77]">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        {!p.is_active && (
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full shrink-0">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {p.promo_code} · {p.discount_value}% off
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{p.total_leads}</p>
                      <p className="text-[10px] text-muted-foreground">leads</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Actions bar */}
                  <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
                    <span className="flex-1 text-[11px] text-muted-foreground">
                      {p.converted_leads}/{p.total_leads} converted
                      {p.total_leads ? ` · ${conv}%` : ''}
                      {p.total_revenue ? ` · ${p.total_revenue.toLocaleString()} EGP` : ''}
                    </span>

                    <button
                      onClick={() => copyLink(p.slug)}
                      className="flex items-center gap-1 text-[11px] text-[#006D77] font-medium
                                 px-3 py-1.5 rounded-lg bg-[#006D77]/5 active:bg-[#006D77]/10 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy link
                    </button>

                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => toggleActive(p)}
                      className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      {p.is_active
                        ? <ToggleRight className="w-5 h-5 text-[#006D77]" />
                        : <ToggleLeft  className="w-5 h-5 text-muted-foreground" />
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Leads panel (bottom sheet)
      ═══════════════════════════════════════════════════════════ */}
      {selectedP && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedP(null)}
          />

          {/* Sheet */}
          <div className="bg-background rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{selectedP.name}</h3>
                  {!selectedP.is_active && (
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {leads.length} lead{leads.length !== 1 ? 's' : ''} ·{' '}
                  <span className="font-mono">{selectedP.promo_code}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLink(selectedP.slug)}
                  className="flex items-center gap-1 text-xs text-[#006D77] font-medium
                             px-3 py-2 rounded-xl bg-[#006D77]/5 active:bg-[#006D77]/10"
                >
                  <Copy className="w-3.5 h-3.5" /> Link
                </button>

                <a
                  href={`/join/${selectedP.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>

                <button
                  onClick={() => setSelectedP(null)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Leads */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3 pb-6">
              {leadsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#006D77] animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-3xl">📋</p>
                  <p className="text-sm text-muted-foreground">No leads yet</p>
                  <p className="text-xs text-muted-foreground">
                    Share: <span className="font-mono text-[#006D77]">/join/{selectedP.slug}</span>
                  </p>
                </div>
              ) : (
                leads.map(lead => (
                  <div key={lead.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">

                    {/* Lead info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(lead.created_at)}</p>
                      </div>

                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS[lead.status].color}`}>
                        {STATUS[lead.status].label}
                      </span>
                    </div>

                    {/* Converted note */}
                    {lead.status === 'converted' && lead.converted_at && (
                      <p className="text-[10px] text-[#4CAF50] mb-2 font-medium">
                        ✓ Became a client on {fmtDate(lead.converted_at)}
                      </p>
                    )}

                    {/* Status transition buttons */}
                    {STATUS_TRANSITIONS[lead.status].length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_TRANSITIONS[lead.status].map(next => (
                          <button
                            key={next}
                            onClick={() => updateLeadStatus(lead.id, next)}
                            className={`text-[11px] px-3 py-1.5 rounded-xl font-medium border
                                        active:scale-95 transition-all ${STATUS[next].color}`}
                          >
                            → {STATUS[next].label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* WhatsApp link */}
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-[11px] text-[#25D366] font-semibold"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          Add / Edit partner modal
      ═══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto p-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">
                {editingP ? 'Edit Partner' : 'New Partner'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Partner Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Partner Name <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Gym Club"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Slug (URL) <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase() }))}
                  placeholder="gymclub"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             font-mono text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Link: <span className="font-mono text-[#006D77]">/join/{form.slug || '...'}</span>
                </p>
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Promo Code <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={form.promo_code}
                  onChange={e => setForm(f => ({ ...f, promo_code: e.target.value.toUpperCase() }))}
                  placeholder="GYMCLUB10"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             font-mono tracking-wider text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Discount %
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                  placeholder="10"
                  min="1" max="100"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Logo URL <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Description <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short tagline shown on the form"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>
            </div>

            <button
              onClick={savePartner}
              disabled={saving || !form.name || !form.slug || !form.promo_code}
              className="w-full mt-5 py-3.5 bg-[#006D77] text-white font-semibold rounded-xl
                         hover:bg-[#004E5C] transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {saving
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                : <><Check className="w-5 h-5" /> {editingP ? 'Save Changes' : 'Add Partner'}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100]
                        bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-xl
                        animate-fade-in pointer-events-none whitespace-nowrap">
          {toast}
        </div>
      )}

      <AdminBottomNav activePage="more" />
    </main>
  )
}
