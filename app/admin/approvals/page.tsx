'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, X, Clock, Phone, Mail, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PendingUser {
  id: string
  full_name: string
  phone: string
  email: string
  created_at: string
  hours_waiting: number
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPending = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_pending_users')
    if (!error && data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (userId: string, name: string) => {
    setActionLoading(userId)
    const { error } = await supabase.rpc('approve_user', { user_id: userId })
    if (error) {
      showToast('Failed to approve. Try again.', 'error')
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId))
      showToast(`✓ ${name} approved!`)
    }
    setActionLoading(null)
  }

  const handleReject = async (userId: string, name: string) => {
    setActionLoading(userId + '_reject')
    try {
      // Full removal via server (deletes the auth account too, so the
      // phone number is freed and they can register again later)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ user_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setUsers(prev => prev.filter(u => u.id !== userId))
      showToast(`${name} request rejected.`)
    } catch {
      showToast('Failed to reject. Try again.', 'error')
    }
    setActionLoading(null)
  }

  const formatWaiting = (hours: number) => {
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${Math.floor(hours)}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium text-center ${
          toast.type === 'success' ? 'bg-[#006D77]' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back()
                else router.push('/admin/more')
              }}
              className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Pending Approvals</h1>
              {!loading && (
                <p className="text-xs text-muted-foreground">{users.length} request{users.length !== 1 ? 's' : ''} waiting</p>
              )}
            </div>
          </div>
          <button onClick={fetchPending} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-border rounded-2xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
                <div className="h-10 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-[#006D77]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">All clear!</h3>
            <p className="text-sm text-muted-foreground">No pending requests right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-[#006D77]">
                      {user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">{user.full_name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{formatWaiting(user.hours_waiting)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(user.id, user.full_name)}
                    disabled={!!actionLoading}
                    className="flex-1 py-2.5 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {actionLoading === user.id + '_reject'
                      ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <X className="w-4 h-4" />}
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(user.id, user.full_name)}
                    disabled={!!actionLoading}
                    className="flex-1 py-2.5 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md shadow-[#006D77]/20"
                  >
                    {actionLoading === user.id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Check className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
