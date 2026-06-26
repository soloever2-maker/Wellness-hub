'use client'

import { useState, useEffect } from 'react'
import { Search, X, MessageCircle, Snowflake, Plus, Users } from 'lucide-react'
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

const filters = ['All', 'Approved', 'Pending']

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setClients(data as Client[])
      }
      setLoading(false)
    }
    fetchClients()
  }, [])

  const filtered = clients.filter((c) => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    const matchesFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Approved' ? c.status === 'approved' :
      c.status === 'pending'
    return matchesSearch && matchesFilter
  })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 space-y-3">
        <h1 className="text-xl font-bold text-foreground">Clients</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
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

      {/* Client List */}
      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-[#006D77]/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {search ? 'No clients match your search' : 'No clients registered yet'}
            </p>
          </div>
        ) : (
          filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="w-full text-left bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#006D77]">
                    {(client.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm">{client.full_name}</h4>
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  client.status === 'approved'
                    ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                    : client.status === 'pending'
                    ? 'bg-[#FF9800]/10 text-[#FF9800]'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {client.status}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Client Detail Sheet */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSelectedClient(null)}>
          <div className="bg-background w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
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
              <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white border border-border rounded-2xl p-4 mb-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground">{selectedClient.email}</span>
              </div>
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
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <Plus className="w-5 h-5 text-[#006D77]" />
                <span className="text-[10px] font-medium text-foreground">Add Pkg</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <Snowflake className="w-5 h-5 text-[#E86500]" />
                <span className="text-[10px] font-medium text-foreground">Freeze</span>
              </button>
              <a href={`https://wa.me/${(selectedClient.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <MessageCircle className="w-5 h-5 text-[#4CAF50]" />
                <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="clients" />
    </main>
  )
}
