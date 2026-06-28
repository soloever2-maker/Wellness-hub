'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, AlertCircle, ArrowLeft, Edit2, Check, X } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type ClassType = {
  id: string
  name: string
  description: string | null
  emoji?: string | null
}

const EMOJIS = ['🧘', '🔥', '💪', '💃', '🌊', '🏃', '🤸', '🎯', '⭐', '🌸', '🏋️', '🎽']

export default function AdminClassesPage() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newEmoji, setNewEmoji] = useState('🧘')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('class_types')
      .select('id, name, description, emoji')
      .order('name')
    if (data) setClassTypes(data as ClassType[])
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('class_types').insert({
      name: newName.trim(),
      description: newDesc.trim() || null,
      emoji: newEmoji,
    })
    if (error) {
      setSaveError(error.message)
    } else {
      setNewName(''); setNewDesc(''); setNewEmoji('🧘')
      setShowAdd(false)
      await fetchClasses()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setDeleteError('')

    // Check for upcoming sessions
    const { count } = await supabase
      .from('class_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('class_type_id', id)
      .gte('start_time', new Date().toISOString())

    if ((count ?? 0) > 0) {
      setDeleteError(`Can't delete — ${count} upcoming session${count! > 1 ? 's' : ''} using this class`)
      setDeletingId(null)
      setConfirmDeleteId(null)
      return
    }

    const { error } = await supabase.from('class_types').delete().eq('id', id)
    if (error) {
      setDeleteError(error.message)
    } else {
      setClassTypes(prev => prev.filter(c => c.id !== id))
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('class_types')
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq('id', id)
    if (!error) {
      setClassTypes(prev => prev.map(c =>
        c.id === id ? { ...c, name: editName.trim(), description: editDesc.trim() || null } : c
      ))
      setEditingId(null)
    }
    setSaving(false)
  }

  return (
    <main className="bg-background min-h-screen pb-24">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more"
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Class Types</h1>
            <p className="text-xs text-muted-foreground">{classTypes.length} class{classTypes.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={() => { setShowAdd(true); setSaveError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-[#006D77] text-white text-sm font-semibold rounded-xl hover:bg-[#004E5C] transition-colors">
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {deleteError && (
        <div className="mx-4 mt-4 px-4 py-3 bg-[#E53935]/10 border border-[#E53935]/20 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
          <p className="text-sm text-[#E53935]">{deleteError}</p>
          <button onClick={() => setDeleteError('')} className="ml-auto">
            <X className="w-4 h-4 text-[#E53935]" />
          </button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : classTypes.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-4xl mb-3">🧘</p>
            <p className="font-semibold text-foreground">No class types yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first class type</p>
          </div>
        ) : (
          classTypes.map(ct => (
            <div key={ct.id}
              className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">

              {editingId === ct.id ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 font-semibold"
                    placeholder="Class name"
                    autoFocus
                  />
                  <input
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                    placeholder="Description (optional)"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-border rounded-xl text-sm text-foreground">
                      Cancel
                    </button>
                    <button onClick={() => handleEdit(ct.id)} disabled={saving || !editName.trim()}
                      className="px-4 py-2 bg-[#006D77] text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === ct.id ? (
                /* Delete confirm */
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">Delete "{ct.name}"?</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Past sessions will keep their data. Future sessions must be removed first.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(ct.id)}
                      disabled={deletingId === ct.id}
                      className="flex-1 py-2.5 bg-[#E53935] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                      {deletingId === ct.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal view */
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-2xl shrink-0">{ct.emoji || '🧘'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{ct.name}</p>
                    {ct.description && (
                      <p className="text-xs text-muted-foreground truncate">{ct.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingId(ct.id); setEditName(ct.name); setEditDesc(ct.description || '') }}
                      className="w-8 h-8 rounded-xl bg-[#006D77]/10 flex items-center justify-center hover:bg-[#006D77]/20 transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-[#006D77]" />
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(ct.id); setDeleteError('') }}
                      className="w-8 h-8 rounded-xl bg-[#E53935]/10 flex items-center justify-center hover:bg-[#E53935]/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-[#E53935]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AdminBottomNav activePage="more" />

      {/* Add Class Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-sm px-6 pt-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-5">Add New Class Type</h3>

            {/* Emoji picker */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      newEmoji === e
                        ? 'bg-[#006D77]/10 ring-2 ring-[#006D77] scale-110'
                        : 'bg-muted hover:bg-muted/80'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Class Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Power Yoga, Mat Pilates..."
                autoFocus
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
              />
            </div>

            {/* Description */}
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Description <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief description of the class"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
              />
            </div>

            {saveError && (
              <p className="text-xs text-[#E53935] mb-3 text-center">{saveError}</p>
            )}

            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#004E5C] transition-colors shadow-md">
              {saving
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Plus className="w-5 h-5" /> Add Class Type</>}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
