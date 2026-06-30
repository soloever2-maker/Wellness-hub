// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/admin/packages-editor/page.tsx
// (زرار Active: الدايرة بتفضل جوه الإطار صح — شمال off ويمين on)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Info, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type PackageData = {
  id: string
  name: string
  session_count: number
  validity_days: number
  price: number
  is_active: boolean
}

export default function AdminPackagesEditorPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('packages').select('*').order('display_order').then(({ data }) => {
      if (data) setPackages(data)
      setLoading(false)
    })
  }, [])

  const handleChange = (id: string, field: keyof PackageData, value: string | number | boolean) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setEditedIds(prev => new Set(prev).add(id))
  }

  const handleSave = async (id: string) => {
    const pkg = packages.find(p => p.id === id)
    if (!pkg) return
    setSavingId(id)
    await supabase.from('packages').update({
      name: pkg.name,
      session_count: pkg.session_count,
      validity_days: pkg.validity_days,
      price: pkg.price,
      is_active: pkg.is_active,
    }).eq('id', id)
    setSavingId(null)
    setSavedId(id)
    setEditedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    setTimeout(() => setSavedId(null), 2000)
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Edit Packages</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
          </div>
        ) : packages.map((pkg) => (
          <div key={pkg.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${editedIds.has(pkg.id) ? 'border-[#006D77] ring-1 ring-[#006D77]/20' : 'border-border'}`}>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Package Name</label>
                <input type="text" value={pkg.name}
                  onChange={e => handleChange(pkg.id, 'name', e.target.value)}
                  className="w-full text-lg font-bold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Sessions + Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sessions</label>
                  <input type="number" value={pkg.session_count}
                    onChange={e => handleChange(pkg.id, 'session_count', parseInt(e.target.value) || 0)}
                    className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Validity (days)</label>
                  <input type="number" value={pkg.validity_days}
                    onChange={e => handleChange(pkg.id, 'validity_days', parseInt(e.target.value) || 0)}
                    className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (EGP)</label>
                <input type="number" value={pkg.price}
                  onChange={e => handleChange(pkg.id, 'price', parseInt(e.target.value) || 0)}
                  className="w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Active</span>
                <button onClick={() => handleChange(pkg.id, 'is_active', !pkg.is_active)}
                  role="switch"
                  aria-checked={pkg.is_active}
                  className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${pkg.is_active ? 'bg-[#006D77]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${pkg.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Save Button */}
              {(editedIds.has(pkg.id) || savedId === pkg.id) && (
                <button onClick={() => handleSave(pkg.id)} disabled={savingId === pkg.id}
                  className={`w-full py-2.5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    savedId === pkg.id
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-[#006D77] text-white hover:bg-[#004E5C]'
                  } disabled:opacity-60`}
                >
                  {savingId === pkg.id && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savedId === pkg.id && <><Check className="w-4 h-4" /> Saved!</>}
                  {editedIds.has(pkg.id) && savingId !== pkg.id && 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="bg-[#FFD9B8]/20 border border-[#FFD9B8] rounded-2xl px-4 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#006D77] mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">Changes apply to new purchases only. Existing client packages are not affected.</p>
        </div>
      </div>
    </main>
  )
}
