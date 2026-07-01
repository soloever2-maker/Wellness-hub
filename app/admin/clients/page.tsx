'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, MessageCircle, Snowflake, Plus, Users, Loader2, Check, Package, Trash2, CreditCard, RotateCcw, KeyRound, Copy, RefreshCw, Minus, SlidersHorizontal, Handshake } from 'lucide-react'
import { ConfirmModal } from '@/components/confirm-modal'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  auth_id: string
  full_name: string
  phone: string
  email: string
  status: string
  created_at: string
}

type PackageOption = {
  id: string
  name: string
  session_count: number
  validity_days: number
  price: number
}

type ClientPackageInfo = {
  id: string
  status: string
  sessions_remaining: number
  freeze_start: string | null
}

type PaymentRecord = {
  id: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string
  package: { name: string }
}

const filters = ['All', 'Approved', 'Pending']

function AdminClientsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [pkgByClient, setPkgByClient] = useState<Record<string, ClientPackageInfo>>({})
  const [partnerByClient, setPartnerByClient] = useState<Record<string, string>>({})
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientPkg, setClientPkg] = useState<ClientPackageInfo | null>(null)
  const [clientPayments, setClientPayments] = useState<PaymentRecord[]>([])
  const [refundingId, setRefundingId]     = useState<string | null>(null)
  const [showAdjust, setShowAdjust]         = useState(false)
  const [adjustVal, setAdjustVal]           = useState(0)
  const [adjustSaving, setAdjustSaving]     = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showAddPkg, setShowAddPkg] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showResetPwd, setShowResetPwd] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPwd, setResettingPwd] = useState(false)
  const [lastResetPwd, setLastResetPwd] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, pkgsRes, clientPkgsRes, partnerLeadsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
        supabase.from('client_packages')
          .select('id, client_id, status, sessions_remaining, freeze_start')
          .in('status', ['active', 'frozen']),
        supabase.from('partner_leads')
          .select('client_id, partners!inner(name)')
          .not('client_id', 'is', null),
      ])
      const loadedClients = (clientsRes.data as Client[]) || []
      if (clientsRes.data) setClients(loadedClients)

      // Build partner map: client_id → partner name
      if (partnerLeadsRes.data) {
        const pmap: Record<string, string> = {}
        for (const row of partnerLeadsRes.data as any[]) {
          if (row.client_id && row.partners?.name) {
            pmap[row.client_id] = row.partners.name
          }
        }
        setPartnerByClient(pmap)
      }

      if (clientPkgsRes.data) {
        const map: Record<string, ClientPackageInfo> = {}
        for (const row of clientPkgsRes.data as (ClientPackageInfo & { client_id: string })[]) {
          // a client should have at most one active/frozen package, but
          // if duplicates ever exist, keep the most recent (rows already
          // come back newest-first isn't guaranteed here, so just keep first seen)
          if (!map[row.client_id]) map[row.client_id] = row
        }
        setPkgByClient(map)
      }

      let firstPkgId = ''
      if (pkgsRes.data) {
        setPackages(pkgsRes.data as PackageOption[])
        if (pkgsRes.data[0]) firstPkgId = pkgsRes.data[0].id
        setSelectedPkgId(firstPkgId)
      }
      setLoading(false)

      // Deep link from Dashboard "Package Requests" → Confirm button
      const linkedClientId = searchParams.get('clientId')
      const linkedPkgId = searchParams.get('packageId')
      if (linkedClientId) {
        const match = loadedClients.find(c => c.id === linkedClientId)
        if (match) {
          await openClient(match)
          setSelectedPkgId(linkedPkgId || firstPkgId)
          setShowAddPkg(true)
        }
        router.replace('/admin/clients')
      }
    }
    fetchData()
  }, [])

  const openClient = async (client: Client) => {
    setSelectedClient(client)
    setClientPkg(null)
    setClientPayments([])

    const [pkgRes, pmtRes] = await Promise.all([
      supabase.from('client_packages')
        .select('id, status, sessions_remaining, freeze_start')
        .eq('client_id', client.id)
        .in('status', ['active', 'frozen'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('payments')
        .select('id, amount, status, paid_at, created_at, package:packages!package_id(name)')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (pkgRes.data) setClientPkg(pkgRes.data as ClientPackageInfo)
    if (pmtRes.data) setClientPayments(pmtRes.data as unknown as PaymentRecord[])
  }

  const handleRemovePkg = async () => {
    if (!clientPkg || !selectedClient) return
    setShowRemoveConfirm(false)
    setSaving(true)
    await supabase.from('client_packages')
      .update({ status: 'expired' })
      .eq('id', clientPkg.id)
    setClientPkg(null)
    setPkgByClient(prev => {
      const next = { ...prev }
      delete next[selectedClient.id]
      return next
    })
    showToast('Package removed ✓')
    setSaving(false)
  }

  const handleRefundPayment = async (paymentId: string) => {
    setConfirmRefundId(null)
    setRefundingId(paymentId)
    const { error } = await supabase.from('payments')
      .update({ status: 'refunded' })
      .eq('id', paymentId)
    if (error) {
      showToast(`⚠️ Refund failed: ${error.message}`)
    } else {
      setClientPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'refunded' } : p))
      showToast('Payment marked as refunded ✓')
    }
    setRefundingId(null)
  }

  const handleAdjustSessions = async (delta: number) => {
    if (!clientPkg) return
    const next = Math.max(0, clientPkg.sessions_remaining + delta)
    setAdjustSaving(true)
    const { error } = await supabase
      .from('client_packages')
      .update({ sessions_remaining: next })
      .eq('id', clientPkg.id)
    if (!error) {
      setClientPkg({ ...clientPkg, sessions_remaining: next })
      showToast(`Sessions updated: ${next} ✓`)
    } else {
      showToast('⚠️ Update failed: ' + error.message)
    }
    setAdjustSaving(false)
  }

  const handleAddPkg = async () => {
    if (!selectedClient || !selectedPkgId) return
    setSaving(true)
    const pkg = packages.find(p => p.id === selectedPkgId)
    if (!pkg) { setSaving(false); return }

    // Deactivate any existing active/frozen package first (avoids unique constraint)
    if (clientPkg) {
      const { error: expireError } = await supabase
        .from('client_packages')
        .update({ status: 'expired' })
        .eq('client_id', selectedClient.id)
        .in('status', ['active', 'frozen'])
      if (expireError) {
        showToast(`⚠️ Could not replace old package: ${expireError.message}`)
        setSaving(false)
        return
      }
    }

    const expiry = new Date()
    expiry.setDate(expiry.getDate() + pkg.validity_days)

    const { error } = await supabase.from('client_packages').insert({
      client_id: selectedClient.id,
      package_id: selectedPkgId,
      sessions_remaining: pkg.session_count,
      sessions_total: pkg.session_count,
      expiry_date: expiry.toISOString(),
      status: 'active',
    })

    if (error) {
      console.error('client_packages insert failed:', error)
      showToast(`\u26a0\ufe0f Could not add package: ${error.message}`)
      setSaving(false)
      return
    }

    // If the client already has a pending request for this exact package
    // (from tapping "Buy Package" in the app), confirm that one instead of
    // creating a second, disconnected payment row.
    const { data: pendingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('client_id', selectedClient.id)
      .eq('package_id', selectedPkgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let paymentError: { message: string } | null = null
    if (pendingPayment) {
      const { error } = await supabase.from('payments').update({
        status: 'paid',
        gateway: 'cash',
        paid_at: new Date().toISOString(),
      }).eq('id', pendingPayment.id)
      paymentError = error
    } else {
      const { error } = await supabase.from('payments').insert({
        client_id: selectedClient.id,
        package_id: selectedPkgId,
        amount: pkg.price,
        gateway: 'cash',
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      paymentError = error
    }

    if (paymentError) console.error('Payment insert/update failed:', paymentError)

    // Notify client their package is active
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        title: '🎉 Package Ready — Book Now!',
        body: `You have ${pkg.session_count} sessions waiting! Tap here to book your first class 👇`,
        type: 'package_activated',
        url: '/schedule',
      }),
    }).catch(() => {})

    showToast(
      paymentError
        ? `⚠️ Package added, but payment was NOT recorded: ${paymentError.message}`
        : `✓ ${pkg.name} added for ${selectedClient.full_name}`
    )
    setShowAddPkg(false)
    // Refresh package info
    const [pkgRes2, pmtRes2] = await Promise.all([
      supabase.from('client_packages').select('id, status, sessions_remaining, freeze_start')
        .eq('client_id', selectedClient.id).in('status', ['active', 'frozen']).limit(1).maybeSingle(),
      supabase.from('payments')
        .select('id, amount, status, paid_at, created_at, package:packages!package_id(name)')
        .eq('client_id', selectedClient.id).order('created_at', { ascending: false }).limit(10),
    ])
    if (pkgRes2.data) {
      setClientPkg(pkgRes2.data as ClientPackageInfo)
      setPkgByClient(prev => ({ ...prev, [selectedClient.id]: pkgRes2.data as ClientPackageInfo }))
    }
    if (pmtRes2.data) setClientPayments(pmtRes2.data as unknown as PaymentRecord[])
    setSaving(false)
  }

  const generatePassword = () => {
    // Readable random password — no ambiguous chars (0/O, 1/l/I)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let pwd = ''
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setNewPassword(pwd)
  }

  const openResetPwd = () => {
    setShowResetPwd(true)
    setShowAddPkg(false)
    setLastResetPwd('')
    generatePassword()
  }

  const handleResetPassword = async () => {
    if (!selectedClient || !newPassword) return
    if (newPassword.length < 6) {
      showToast('⚠️ Password must be at least 6 characters')
      return
    }
    setShowResetConfirm(false)
    setResettingPwd(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          client_auth_id: selectedClient.auth_id,
          new_password: newPassword,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Reset failed')

      setLastResetPwd(newPassword)
      showToast('✓ Password reset successfully')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed'
      showToast(`⚠️ ${msg}`)
    } finally {
      setResettingPwd(false)
    }
  }

  const handleFreeze = async () => {
    if (!clientPkg || !selectedClient) return
    setSaving(true)
    if (clientPkg.status === 'frozen') {
      // Unfreeze
      const frozenDays = clientPkg.freeze_start
        ? Math.ceil((Date.now() - new Date(clientPkg.freeze_start).getTime()) / 86400000)
        : 0
      const { data: cp } = await supabase.from('client_packages').select('expiry_date').eq('id', clientPkg.id).single()
      const newExpiry = cp ? new Date(cp.expiry_date) : new Date()
      newExpiry.setDate(newExpiry.getDate() + frozenDays)

      await supabase.from('client_packages').update({
        status: 'active', freeze_start: null, expiry_date: newExpiry.toISOString(),
      }).eq('id', clientPkg.id)

      const updated = { ...clientPkg, status: 'active', freeze_start: null }
      setClientPkg(updated)
      setPkgByClient(prev => ({ ...prev, [selectedClient.id]: updated }))
      showToast('Package unfrozen ✓')
    } else {
      // Freeze
      await supabase.from('client_packages').update({
        status: 'frozen', freeze_start: new Date().toISOString(),
      }).eq('id', clientPkg.id)

      const updated = { ...clientPkg, status: 'frozen', freeze_start: new Date().toISOString() }
      setClientPkg(updated)
      setPkgByClient(prev => ({ ...prev, [selectedClient.id]: updated }))
      showToast('Package frozen ❄️')
    }
    setSaving(false)
  }

  const filtered = clients.filter(c => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    const matchesFilter = activeFilter === 'All' ? true : activeFilter === 'Approved' ? c.status === 'approved' : c.status === 'pending'
    return matchesSearch && matchesFilter
  })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[200] bg-[#006D77] text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-lg text-center">
          {toast}
        </div>
      )}

      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Clients</h1>
          <UserMenu variant="admin" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or phone..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
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
            <Users className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No clients found</p>
          </div>
        ) : filtered.map(client => {
          const pkg = pkgByClient[client.id]
          return (
          <button key={client.id} onClick={() => openClient(client)}
            className="w-full text-left bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#006D77]">
                  {(client.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">{client.full_name || '—'}</h4>
                <p className="text-xs text-muted-foreground">{client.phone}</p>
                {partnerByClient[client.id] && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold
                                   text-[#E86500] bg-[#E86500]/8 px-2 py-0.5 rounded-full">
                    <Handshake className="w-2.5 h-2.5" />
                    {partnerByClient[client.id]}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  client.status === 'approved' ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                  : client.status === 'pending' ? 'bg-[#FF9800]/10 text-[#FF9800]'
                  : 'bg-gray-100 text-gray-400'
                }`}>{client.status}</span>
                {pkg ? (
                  <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    pkg.status === 'frozen' ? 'bg-[#5C6B6E]/10 text-[#5C6B6E]' : 'bg-[#006D77]/10 text-[#006D77]'
                  }`}>
                    {pkg.status === 'frozen' ? <Snowflake className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
                    {pkg.status === 'frozen' ? 'Frozen' : `${pkg.sessions_remaining} left`}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    <Package className="w-2.5 h-2.5" /> No package
                  </span>
                )}
              </div>
            </div>
          </button>
        )})}
      </div>

      {/* Client Detail Sheet */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setSelectedClient(null); setShowAddPkg(false); setShowResetPwd(false); setLastResetPwd('') }}>
          <div className="bg-background w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <span className="font-bold text-[#006D77]">
                      {(selectedClient.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedClient.full_name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedClient(null); setShowAddPkg(false); setShowResetPwd(false); setLastResetPwd('') }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="bg-white border border-border rounded-2xl p-4 mb-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-medium text-foreground capitalize">{selectedClient.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(selectedClient.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {clientPkg && (
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sessions Remaining</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${clientPkg.status === 'frozen' ? 'text-[#E86500]' : 'text-[#4CAF50]'}`}>
                          {clientPkg.sessions_remaining} {clientPkg.status === 'frozen' ? '❄️' : ''}
                        </span>
                        <button
                          onClick={() => setShowAdjust(v => !v)}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                          <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    {showAdjust && (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAdjustSessions(-1)}
                          disabled={adjustSaving || clientPkg.sessions_remaining <= 0}
                          className="w-9 h-9 rounded-xl bg-[#E53935]/10 text-[#E53935] flex items-center justify-center disabled:opacity-40 hover:bg-[#E53935]/20">
                          {adjustSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                        </button>
                        <span className="text-lg font-bold text-foreground w-8 text-center">
                          {clientPkg.sessions_remaining}
                        </span>
                        <button
                          onClick={() => handleAdjustSessions(+1)}
                          disabled={adjustSaving}
                          className="w-9 h-9 rounded-xl bg-[#006D77]/10 text-[#006D77] flex items-center justify-center disabled:opacity-40 hover:bg-[#006D77]/20">
                          {adjustSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add Package section */}
              {showAddPkg ? (
                <div className="bg-white border border-[#006D77] rounded-2xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Select Package</p>
                  {packages.map(pkg => (
                    <button key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${selectedPkgId === pkg.id ? 'border-[#006D77] bg-[#006D77]/5' : 'border-border'}`}>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.session_count} sessions · {pkg.validity_days} days</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#006D77]">{pkg.price} EGP</span>
                        {selectedPkgId === pkg.id && <Check className="w-4 h-4 text-[#006D77]" />}
                      </div>
                    </button>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowAddPkg(false)}
                      className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                    <button onClick={handleAddPkg} disabled={saving}
                      className="flex-1 py-2.5 bg-[#006D77] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm</>}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Reset Password section */}
              {showResetPwd ? (
                <div className="bg-white border border-[#006D77] rounded-2xl p-4 mb-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Reset Password</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set a new password for {selectedClient.full_name}, then send it to them on WhatsApp.
                  </p>

                  {lastResetPwd ? (
                    <>
                      <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-0.5">New password</p>
                          <p className="text-sm font-bold text-foreground tracking-wide">{lastResetPwd}</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(lastResetPwd); showToast('Copied ✓') }}
                          className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
                          <Copy className="w-3.5 h-3.5 text-foreground" />
                        </button>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setShowResetPwd(false); setLastResetPwd('') }}
                          className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                          Done
                        </button>
                        <a href={`https://wa.me/${(selectedClient.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedClient.full_name}, your password has been reset.\n\nNew password: ${lastResetPwd}\n\nPlease use it to sign in — you can change it anytime from your profile.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                          <MessageCircle className="w-4 h-4" /> Send on WhatsApp
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-3 text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
                        <button type="button" onClick={generatePassword} title="Generate new"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#006D77]">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowResetPwd(false)}
                          className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                          Cancel
                        </button>
                        <button onClick={() => setShowResetConfirm(true)} disabled={resettingPwd || newPassword.length < 6}
                          className="flex-1 py-2.5 bg-[#006D77] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                          {resettingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm Reset</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="grid grid-cols-5 gap-2">
                <button onClick={() => { setShowAddPkg(!showAddPkg); setShowResetPwd(false) }}
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                  <Plus className="w-5 h-5 text-[#006D77]" />
                  <span className="text-[10px] font-medium text-foreground">Add Pkg</span>
                </button>
                <button onClick={handleFreeze} disabled={!clientPkg || saving}
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-40">
                  {saving ? <Loader2 className="w-5 h-5 text-[#E86500] animate-spin" />
                    : <Snowflake className="w-5 h-5 text-[#E86500]" />}
                  <span className="text-[10px] font-medium text-foreground">
                    {clientPkg?.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                  </span>
                </button>
                <button onClick={() => setShowRemoveConfirm(true)} disabled={!clientPkg || saving}
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-[#E53935]/30 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 className="w-5 h-5 text-[#E53935]" />
                  <span className="text-[10px] font-medium text-[#E53935]">Remove Pkg</span>
                </button>
                <button onClick={openResetPwd}
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                  <KeyRound className="w-5 h-5 text-[#006D77]" />
                  <span className="text-[10px] font-medium text-foreground">Reset Pwd</span>
                </button>
                <a href={`https://wa.me/${(selectedClient.phone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                  <MessageCircle className="w-5 h-5 text-[#4CAF50]" />
                  <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
                </a>
              </div>


              {/* Payments History */}
              {clientPayments.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-2 mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#006D77]" /> Payment History
                  </p>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden">
                    {clientPayments.map((p, i) => {
                      const statusColor =
                        p.status === 'paid'     ? 'text-[#4CAF50] bg-[#4CAF50]/10' :
                        p.status === 'refunded' ? 'text-[#E53935] bg-[#E53935]/10' :
                                                  'text-[#FF9800] bg-[#FF9800]/10'
                      const date = p.paid_at || p.created_at
                      return (
                        <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i < clientPayments.length - 1 ? 'border-b border-border' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {(p.package as any)?.name || '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-foreground shrink-0">
                            {Number(p.amount).toLocaleString()} EGP
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                            {p.status}
                          </span>
                          {p.status === 'paid' && (
                            <button
                              onClick={() => setConfirmRefundId(p.id)}
                              disabled={refundingId === p.id}
                              className="w-7 h-7 rounded-full bg-[#E53935]/10 flex items-center justify-center hover:bg-[#E53935]/20 transition-colors disabled:opacity-50 shrink-0"
                              title="Mark as refunded"
                            >
                              {refundingId === p.id
                                ? <Loader2 className="w-3.5 h-3.5 text-[#E53935] animate-spin" />
                                : <RotateCcw className="w-3.5 h-3.5 text-[#E53935]" />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="clients" />

      <ConfirmModal
        open={showRemoveConfirm}
        title="Remove Package?"
        message="This will expire the client's active package. This cannot be undone."
        confirmLabel="Remove"
        destructive
        loading={saving}
        onCancel={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemovePkg}
      />

      <ConfirmModal
        open={!!confirmRefundId}
        title="Refund Payment?"
        message="This will mark the payment as refunded."
        confirmLabel="Yes, Refund"
        destructive
        loading={!!refundingId}
        onCancel={() => setConfirmRefundId(null)}
        onConfirm={() => confirmRefundId && handleRefundPayment(confirmRefundId)}
      />

      <ConfirmModal
        open={showResetConfirm}
        title="Reset Password?"
        message={selectedClient ? `Reset password for ${selectedClient.full_name}? They'll need the new password to sign in.` : ''}
        confirmLabel="Reset Password"
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={handleResetPassword}
        loading={resettingPwd}
      />
    </main>
  )
}

export default function AdminClientsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
      </div>
    }>
      <AdminClientsPageInner />
    </Suspense>
  )
}
