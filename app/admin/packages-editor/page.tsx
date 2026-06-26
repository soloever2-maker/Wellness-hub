'use client'

import { useState } from 'react'
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

interface PackageData {
  id: string
  name: string
  sessions: number
  validity: number
  price: number
  isActive: boolean
}

const initialPackages: PackageData[] = [
  { id: '1', name: 'Drop In', sessions: 1, validity: 1, price: 200, isActive: true },
  { id: '2', name: '4 Classes', sessions: 4, validity: 30, price: 700, isActive: true },
  { id: '3', name: '8 Classes', sessions: 8, validity: 45, price: 1200, isActive: true },
  { id: '4', name: '12 Classes', sessions: 12, validity: 60, price: 1600, isActive: true },
]

export default function AdminPackagesEditorPage() {
  const [packages, setPackages] = useState<PackageData[]>(initialPackages)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())

  const handleChange = (id: string, field: keyof PackageData, value: string | number | boolean) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setEditedIds(prev => new Set(prev).add(id))
  }

  const handleSave = (id: string) => {
    setEditedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Edit Packages</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${editedIds.has(pkg.id) ? 'border-[#006D77] ring-1 ring-[#006D77]/20' : 'border-border'}`}>
            <div className="p-4 space-y-4">
              {/* Package Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Package Name</label>
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => handleChange(pkg.id, 'name', e.target.value)}
                  className="w-full text-lg font-bold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Sessions + Validity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sessions</label>
                  <input
                    type="number"
                    value={pkg.sessions}
                    onChange={(e) => handleChange(pkg.id, 'sessions', parseInt(e.target.value) || 0)}
                    className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Validity (days)</label>
                  <input
                    type="number"
                    value={pkg.validity}
                    onChange={(e) => handleChange(pkg.id, 'validity', parseInt(e.target.value) || 0)}
                    className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (EGP)</label>
                <input
                  type="number"
                  value={pkg.price}
                  onChange={(e) => handleChange(pkg.id, 'price', parseInt(e.target.value) || 0)}
                  className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Active</span>
                <button
                  onClick={() => handleChange(pkg.id, 'isActive', !pkg.isActive)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${pkg.isActive ? 'bg-[#006D77]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${pkg.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Save Button */}
              {editedIds.has(pkg.id) && (
                <button
                  onClick={() => handleSave(pkg.id)}
                  className="w-full py-2.5 bg-[#006D77] text-white font-medium rounded-xl hover:bg-[#004E5C] transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Info Note */}
        <div className="bg-[#FFD9B8]/20 border border-[#FFD9B8] rounded-2xl px-4 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#006D77] mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">Changes apply to new purchases only. Existing client packages are not affected.</p>
        </div>
      </div>
    </main>
  )
}
