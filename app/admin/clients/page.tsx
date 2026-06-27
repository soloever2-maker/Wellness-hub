'use client'

import { useState, useEffect } from 'react'
import { Search, X, MessageCircle, Snowflake, Plus, Users, Loader2, Check, Package } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
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

const filters = ['All', 'Approved', 'Pending']

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientPkg, setClientPkg] = useState<ClientPackageInfo | null>(null)
  const [showAddPkg, setShowAddPkg] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, pkgsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
      ])
      if (clientsRes.data) setClients(clientsRes.data as Client[])
      if (pkgsRes.data) {
        setPackages(pkgsRes.data as PackageOption[])
        if (pkgsRes.data[0]) setSelectedPkgId(pkgsRes.data[0].id)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const openClient = async (client: Client) => {
    setSelectedClient(client)
    setClientPkg(null)
    const { data } = await supabase
      .from('client_packages')
      .select('id, status, sessions_remaining, freeze_start')
      .eq('client_id', client.id)
      .in('status', ['active', 'frozen'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) setClientPkg(data as ClientPackageInfo)
  }

  const handleAddPkg = async () => {
    if (!selectedClient || !selectedPkgId) return
    setSaving(true)
    const pkg = packages.find(p => p.id === selectedPkgId)
    if (!pkg) { setSaving(false); return }

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

    if (!error) {
      // Log payment
      await supabase.from('payments').insert({
        client_id: selectedClient.id,
        package_id: selectedPkgId,
        amount: pkg.price,
        method: 'manual',
        status: 'paid',
      })
      showToast(`✓ ${pkg.name} added for ${selectedClient.full_name}`)
      setShowAddPkg(false)
      // Refresh package info
      const { data } = await supabase.from('client_packages').select('id, status, sessions_remaining, freeze_start')
        .eq('client_id', selectedClient.id).in('status', ['active', 'frozen']).limit(1).maybeSingle()
      if (data) setClientPkg(data as ClientPackageInfo)
    }
    setSaving(false)
  }

  const handleFreeze = async () => {
    if (!clientPkg) return
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

      setClientPkg({ ...clientPkg, status: 'active', freeze_start: null })
      showToast('Package unfrozen ✓')
    } else {
      // Freeze
      await supabase.from('client_packages').update({
        status: 'frozen', freeze_start: new Date().toISOString(),
      }).eq('id', clientPkg.id)

      setClientPkg({ ...clientPkg, status: 'frozen', freeze_start: new Date().toISOString() })
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
        <h1 className="text-xl font-bold text-foreground">Clients</h1>
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
        ) : filtered.map(client => (
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
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                client.status === 'approved' ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                : client.status === 'pending' ? 'bg-[#FF9800]/10 text-[#FF9800]'
                : 'bg-gray-100 text-gray-400'
              }`}>{client.status}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Client Detail Sheet */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setSelectedClient(null); setShowAddPkg(false) }}>
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
                <button onClick={() => { setSelectedClient(null); setShowAddPkg(false) }}
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
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Package</span>
                    <span className={`text-sm font-medium ${clientPkg.status === 'frozen' ? 'text-[#E86500]' : 'text-[#4CAF50]'}`}>
                      {clientPkg.sessions_remaining} sessions {clientPkg.status === 'frozen' ? '❄️ Frozen' : 'remaining'}
                    </span>
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

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setShowAddPkg(!showAddPkg)}
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
                <a href={`https://wa.me/${(selectedClient.phone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                  <MessageCircle className="w-5 h-5 text-[#4CAF50]" />
                  <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="clients" />
    </main>
  )
}
