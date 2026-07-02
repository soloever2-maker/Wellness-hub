'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Send, Megaphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Audience = 'all' | 'active' | 'expiring'

type AudienceOption = {
  id: Audience
  label: string
  count: number
  desc: string
}

export default function AdminBroadcastPage() {
  const [selectedAudience, setSelectedAudience] = useState<Audience>('all')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number; reason?: string } | null>(null)
  const [audiences, setAudiences] = useState<AudienceOption[]>([
    { id: 'all',      label: 'All Clients',      count: 0, desc: 'All approved clients' },
    { id: 'active',   label: 'Active Packages',  count: 0, desc: 'Clients with active packages' },
    { id: 'expiring', label: 'Expiring Soon',    count: 0, desc: 'Packages expiring in 7 days' },
  ])

  useEffect(() => {
    const fetchCounts = async () => {
      const [allRes, activeRes, expiringRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('status', 'approved').eq('role', 'client'),
        supabase.from('client_packages').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('client_packages').select('id', { count: 'exact' }).eq('status', 'active')
          .lte('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])
      setAudiences([
        { id: 'all',      label: 'All Clients',     count: allRes.count || 0,      desc: 'All approved clients' },
        { id: 'active',   label: 'Active Packages', count: activeRes.count || 0,   desc: 'Clients with active packages' },
        { id: 'expiring', label: 'Expiring Soon',   count: expiringRes.count || 0, desc: 'Packages expiring in 7 days' },
      ])
    }
    fetchCounts()
  }, [])

  const selectedCount = audiences.find(a => a.id === selectedAudience)?.count || 0

  const getClientIds = async (): Promise<string[]> => {
    if (selectedAudience === 'all') {
      const { data } = await supabase.from('users').select('id').eq('status', 'approved').eq('role', 'client')
      return data?.map(c => c.id) || []
    }
    if (selectedAudience === 'active') {
      const { data } = await supabase.from('client_packages').select('client_id').eq('status', 'active')
      return data?.map(p => p.client_id) || []
    }
    if (selectedAudience === 'expiring') {
      const { data } = await supabase.from('client_packages').select('client_id').eq('status', 'active')
        .lte('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      return data?.map(p => p.client_id) || []
    }
    return []
  }

  const handleSend = async () => {
    setSending(true)
    setResult(null)
    try {
      const clientIds = await getClientIds()
      if (!clientIds.length) { setSending(false); return }

      // Call the push broadcast API
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds,
          title: title || '📢 Message from Enjy',
          body: message,
        }),
      })

      const data = await res.json()

      // Log in notification_log
      await supabase.from('notification_log').insert(
        clientIds.map(id => ({
          client_id: id,
          type: 'broadcast',
          channel: 'push',
          message,
          status: data.sent > 0 ? 'sent' : 'pending',
          sent_at: new Date().toISOString(),
        }))
      )

      setResult({ sent: data.sent || 0, total: data.total || clientIds.length, reason: data.reason })
      setShowConfirm(false)
      setMessage('')
      setTitle('')
    } catch {
      setResult({ sent: 0, total: 0, reason: 'Network error. Try again.' })
    }
    setSending(false)
  }

  return (
    <main className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Broadcast Message</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">

        {/* Result banner */}
        {result && (
          <div className={`rounded-2xl p-4 flex items-start gap-3 ${
            result.sent > 0 ? 'bg-[#4CAF50]/10 border border-[#4CAF50]/20' : 'bg-[#FF9800]/10 border border-[#FF9800]/20'
          }`}>
            {result.sent > 0
              ? <CheckCircle className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
            }
            <div>
              {result.sent > 0
                ? <p className="text-sm font-semibold text-[#4CAF50]">✓ Sent to {result.sent} of {result.total} clients</p>
                : <p className="text-sm font-semibold text-[#FF9800]">No push subscriptions yet</p>
              }
              {result.reason && <p className="text-xs text-muted-foreground mt-1">{result.reason}</p>}
              {result.sent === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Clients need to enable notifications from their Profile → Notifications toggle first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Audience */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Send to</h3>
          <div className="space-y-2">
            {audiences.map(aud => (
              <button key={aud.id} onClick={() => setSelectedAudience(aud.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-colors ${
                  selectedAudience === aud.id
                    ? 'bg-[#006D77] border-[#006D77] text-white'
                    : 'bg-white border-border text-foreground hover:bg-muted/30'
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  selectedAudience === aud.id ? 'bg-white/20 text-white' : 'bg-[#E0EEF0] text-[#006D77]'
                }`}>
                  {aud.count}
                </div>
                <div>
                  <p className="text-sm font-semibold">{aud.label}</p>
                  <p className={`text-xs ${selectedAudience === aud.id ? 'text-white/70' : 'text-muted-foreground'}`}>{aud.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notification Title <span className="text-muted-foreground font-normal">(optional)</span></h3>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="📢 Message from Enjy"
            className="w-full bg-white border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]" />
        </div>

        {/* Message */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Type your message to clients..."
              className="w-full px-4 py-3 text-sm text-foreground bg-transparent resize-none focus:outline-none min-h-[120px]"
              maxLength={500} />
            <div className="flex justify-end px-4 py-2 border-t border-border">
              <span className="text-xs text-muted-foreground">{message.length}/500</span>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button onClick={() => setShowConfirm(true)}
          disabled={!message.trim() || selectedCount === 0}
          className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#004E5C] transition-colors disabled:opacity-40 shadow-lg shadow-[#006D77]/20">
          <Send className="w-5 h-5" />
          Send Push to {selectedCount} clients
        </button>

        {selectedCount === 0 && (
          <p className="text-xs text-center text-muted-foreground -mt-2">No clients in this group yet</p>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#E0EEF0] flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-6 h-6 text-[#006D77]" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center mb-2">Send Broadcast?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Push notification to <span className="font-semibold text-foreground">{selectedCount} clients</span>. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 py-2.5 bg-[#006D77] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
