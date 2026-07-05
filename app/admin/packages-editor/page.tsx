// ============================================================
// Copy this file over the old one at:
//   app/admin/packages-editor/page.tsx
// (Adds: "+ Add Package" button with inline create form)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Info, Loader2, Check, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type PackageData = {
  id: string
  name: string
  session_count: number
  validity_days: number
  price: number
  is_active: boolean
  display_order: number
}

type NewPackage = {
  name: string
  session_count: number
  validity_days: number
  price: number
  is_active: boolean
}

const EMPTY_NEW: NewPackage = {
  name: '',
  session_count: 8,
  validity_days: 30,
  price: 0,
  is_active: true,
}

export default function AdminPackagesEditorPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())

  // --- Add Package state ---
  const [showAdd, setShowAdd] = useState(false)
  const [newPkg, setNewPkg] = useState<NewPackage>(EMPTY_NEW)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

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

  const handleNewChange = (field: keyof NewPackage, value: string | number | boolean) => {
    setNewPkg(prev => ({ ...prev, [field]: value }))
    setCreateError(null)
  }

  const handleCreate = async () => {
    if (!newPkg.name.trim()) {
      setCreateError('Package name is required')
      return
    }
    if (newPkg.session_count <= 0 || newPkg.validity_days <= 0) {
      setCreateError('Sessions and validity must be greater than 0')
      return
    }
    setCreating(true)
    setCreateError(null)

    const maxOrder = packages.reduce((m, p) => Math.max(m, p.display_order || 0), 0)

    const { data, error } = await supabase
      .from('packages')
      .insert({
        name: newPkg.name.trim(),
        session_count: newPkg.session_count,
        validity_days: newPkg.validity_days,
        price: newPkg.price,
        is_active: newPkg.is_active,
        display_order: maxOrder + 1,
      })
      .select()
      .single()

    setCreating(false)

    if (error || !data) {
      setCreateError(error?.message || 'Failed to create package')
      return
    }

    setPackages(prev => [...prev, data])
    setNewPkg(EMPTY_NEW)
    setShowAdd(false)
  }

  const inputClass = "w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"

  return (
    <main className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground flex-1">Edit Packages</h1>
          <button
            onClick={() => { setShowAdd(v => !v); setCreateError(null) }}
            className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-sm font-medium transition-colors ${
              showAdd
                ? 'bg-white border border-border text-foreground'
                : 'bg-[#006D77] text-white hover:bg-[#004E5C]'
            }`}
          >
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAdd ? 'Cancel' : 'Add Package'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Add Package Form */}
        {showAdd && (
          <div className="bg-white border-2 border-[#006D77] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#006D77]/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#006D77]" />
                </div>
                <h2 className="font-bold text-foreground">New Package</h2>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Package Name</label>
                <input type="text" value={newPkg.name} placeholder="e.g. 12 Sessions"
                  onChange={e => handleNewChange('name', e.target.value)}
                  className={`${inputClass} text-lg font-bold`}
                />
              </div>

              {/* Sessions + Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sessions</label>
                  <input type="number" value={newPkg.session_count}
                    onChange={e => handleNewChange('session_count', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Validity (days)</label>
                  <input type="number" value={newPkg.validity_days}
                    onChange={e => handleNewChange('validity_days', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (EGP)</label>
                <input type="number" value={newPkg.price}
                  onChange={e => handleNewChange('price', parseInt(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Active</span>
                <button onClick={() => handleNewChange('is_active', !newPkg.is_active)}
                  role="switch"
                  aria-checked={newPkg.is_active}
                  className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${newPkg.is_active ? 'bg-[#006D77]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${newPkg.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Error */}
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}

              {/* Create Button */}
              <button onClick={handleCreate} disabled={creating}
                className="w-full py-2.5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 bg-[#006D77] text-white hover:bg-[#004E5C] disabled:opacity-60"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {creating ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </div>
        )}

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
                  className={`${inputClass} text-lg font-bold`}
                />
              </div>

              {/* Sessions + Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sessions</label>
                  <input type="number" value={pkg.session_count}
                    onChange={e => handleChange(pkg.id, 'session_count', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Validity (days)</label>
                  <input type="number" value={pkg.validity_days}
                    onChange={e => handleChange(pkg.id, 'validity_days', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Price (EGP)</label>
                <input type="number" value={pkg.price}
                  onChange={e => handleChange(pkg.id, 'price', parseInt(e.target.value) || 0)}
                  className={inputClass}
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

        <div className="bg-[#EDD7C9]/20 border border-[#EDD7C9] rounded-2xl px-4 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#006D77] mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">Changes apply to new purchases only. Existing client packages are not affected.</p>
        </div>
      </div>
    </main>
  )
}
