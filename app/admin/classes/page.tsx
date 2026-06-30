// ============================================================
// انسخ الملف ده فوق القديم في المسار ده:
//   app/admin/classes/page.tsx
// (صفحة Class Types: تعرض الأنواع + تضيف + تعدّل + تشيل)
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X, Loader2, Check, Pencil, Trash2, Dumbbell, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type ClassType = {
  id: string
  name: string
  description: string | null
}

export default function AdminClassTypesPage() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ClassType | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ClassType | null>(null)

  const fetchClassTypes = async () => {
    const { data } = await supabase
      .from('class_types')
      .select('id, name, description')
      .order('name')
    if (data) setClassTypes(data as ClassType[])
    setLoading(false)
  }

  useEffect(() => { fetchClassTypes() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (ct: ClassType) => {
    setEditing(ct)
    setForm({ name: ct.name, description: ct.description || '' })
    setError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Class name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const { error: e } = await supabase
          .from('class_types')
          .update({ name: form.name.trim(), description: form.description.trim() || null })
          .eq('id', editing.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase
          .from('class_types')
          .insert({ name: form.name.trim(), description: form.description.trim() || null })
        if (e) throw e
      }
      setShowModal(false)
      await fetchClassTypes()
    } catch (err: any) {
      setError(err?.message || 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ct: ClassType) => {
    setDeletingId(ct.id)
    setError(null)
    try {
      // امنع الحذف لو فيه كلاسات (جلسات) مربوطة بالنوع ده — عشان ما نكسرش الجدول
      const { count } = await supabase
        .from('class_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_type_id', ct.id)

      if (count && count > 0) {
        setError(`Can't delete "${ct.name}" — it has ${count} scheduled class(es). Remove those from the schedule first.`)
        setConfirmDelete(null)
        return
      }

      const { error: e } = await supabase.from('class_types').delete().eq('id', ct.id)
      if (e) throw e
      setConfirmDelete(null)
      await fetchClassTypes()
    } catch (err: any) {
      setError(err?.message || 'Could not delete. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Class Types</h1>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          The types of classes you offer. These show up when you add a class to the schedule.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : classTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-3">
              <Dumbbell className="w-8 h-8 text-[#006D77]/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No class types yet</p>
            <p className="text-xs text-muted-foreground mt-1">Tap the + button to add your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classTypes.map(ct => (
              <div key={ct.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD9B8]/30 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-[#006D77]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ct.name}</p>
                  {ct.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ct.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(ct)}
                    className="w-9 h-9 rounded-xl bg-[#E0EEF0] flex items-center justify-center hover:bg-[#cfe5e8] transition-colors">
                    <Pencil className="w-4 h-4 text-[#006D77]" />
                  </button>
                  <button onClick={() => { setError(null); setConfirmDelete(ct) }}
                    className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[#006D77] text-white shadow-lg flex items-center justify-center hover:bg-[#004E5C] transition-colors">
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-end" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-28 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{editing ? 'Edit Class Type' : 'Add Class Type'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Class Name</label>
              <input type="text" value={form.name}
                placeholder="e.g. Power Yoga"
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description (optional)</label>
              <textarea value={form.description}
                placeholder="Short description shown to clients"
                rows={3}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 resize-none" />
            </div>

            <button onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> {editing ? 'Save Changes' : 'Add Class Type'}</>}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-center justify-center px-6" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-muted-foreground mb-5">This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete.id}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingId === confirmDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="more" />
    </main>
  )
}
