'use client'

import { useState } from 'react'
import { Search, X, MessageCircle, Snowflake, Plus } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

const clients = [
  { id: 1, name: 'Sarah Ahmed', phone: '+20 101 234 5678', package: '8 Classes', remaining: 5, lastVisit: 'June 22', status: 'active', totalSpent: 4800 },
  { id: 2, name: 'Nour Hassan', phone: '+20 102 345 6789', package: '4 Classes', remaining: 1, lastVisit: 'June 20', status: 'expiring', totalSpent: 2100 },
  { id: 3, name: 'Layla Mohamed', phone: '+20 103 456 7890', package: '12 Classes', remaining: 9, lastVisit: 'June 18', status: 'active', totalSpent: 6400 },
  { id: 4, name: 'Mona Ali', phone: '+20 104 567 8901', package: null, remaining: 0, lastVisit: 'May 30', status: 'no_package', totalSpent: 1400 },
  { id: 5, name: 'Yasmin Khaled', phone: '+20 105 678 9012', package: '4 Classes', remaining: 2, lastVisit: 'June 15', status: 'active', totalSpent: 3500 },
  { id: 6, name: 'Dina Samir', phone: '+20 106 789 0123', package: null, remaining: 0, lastVisit: 'Apr 20', status: 'no_package', totalSpent: 700 },
  { id: 7, name: 'Hana Tarek', phone: '+20 107 890 1234', package: '8 Classes', remaining: 2, lastVisit: 'June 24', status: 'expiring', totalSpent: 5200 },
  { id: 8, name: 'Rana Fathy', phone: '+20 108 901 2345', package: '12 Classes', remaining: 11, lastVisit: 'June 25', status: 'active', totalSpent: 1600 },
]

const filters = ['All', 'Active Package', 'Expiring Soon', 'No Package']

type Client = typeof clients[0]

export default function AdminClientsPage() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchesFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Active Package' ? c.status === 'active' :
      activeFilter === 'Expiring Soon' ? c.status === 'expiring' :
      c.status === 'no_package'
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D63384]/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === f
                  ? 'bg-[#D63384] text-white'
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
        {filtered.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="w-full text-left bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#D63384]">{client.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">{client.name}</h4>
                <p className="text-xs text-muted-foreground">{client.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {client.package ? (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    client.status === 'expiring'
                      ? 'bg-[#FF9800]/10 text-[#FF9800]'
                      : 'bg-[#4CAF50]/10 text-[#4CAF50]'
                  }`}>
                    {client.remaining} left
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full">No Package</span>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Last: {client.lastVisit}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Client Detail Sheet */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSelectedClient(null)}>
          <div className="bg-background w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="font-bold text-[#D63384]">{selectedClient.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedClient.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Package Info */}
            {selectedClient.package && (
              <div className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] rounded-2xl p-4 text-white mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">Active Package</p>
                    <p className="text-lg font-bold">{selectedClient.package}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{selectedClient.remaining}</p>
                    <p className="text-xs text-white/80">remaining</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <Plus className="w-5 h-5 text-[#D63384]" />
                <span className="text-[10px] font-medium text-foreground">Add Pkg</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <Snowflake className="w-5 h-5 text-[#7B2D8E]" />
                <span className="text-[10px] font-medium text-foreground">Freeze</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 py-3 bg-white border border-border rounded-xl hover:bg-muted/30 transition-colors">
                <MessageCircle className="w-5 h-5 text-[#4CAF50]" />
                <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
              </button>
            </div>

            <div className="bg-white border border-border rounded-2xl p-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">{selectedClient.totalSpent.toLocaleString()} EGP</p>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="clients" />
    </main>
  )
}
