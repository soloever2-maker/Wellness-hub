'use client'

import { useState } from 'react'
import { ArrowLeft, Send, Eye, MessageCircle } from 'lucide-react'
import Link from 'next/link'

type Audience = 'all' | 'active' | 'expiring'

const audiences: { id: Audience; label: string; count: number }[] = [
  { id: 'all', label: 'All Clients', count: 42 },
  { id: 'active', label: 'Active Packages', count: 28 },
  { id: 'expiring', label: 'Expiring This Week', count: 5 },
]

const pastBroadcasts = [
  { date: 'June 20, 2026', preview: 'Ramadan schedule update — classes will be at...', sentTo: 42, status: 'Delivered' },
  { date: 'June 15, 2026', preview: 'New Aqua Aerobics class every Tuesday at 6 PM!', sentTo: 28, status: 'Delivered' },
  { date: 'June 10, 2026', preview: 'Your package is expiring soon, renew now to...', sentTo: 7, status: 'Delivered' },
  { date: 'June 5, 2026', preview: 'Eid Mubarak! Studio will be closed from...', sentTo: 42, status: 'Delivered' },
]

export default function AdminBroadcastPage() {
  const [selectedAudience, setSelectedAudience] = useState<Audience>('all')
  const [message, setMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const selectedCount = audiences.find(a => a.id === selectedAudience)?.count || 0

  return (
    <main className="bg-background min-h-screen pb-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Broadcast Message</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Audience Selector */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Send to</h3>
          <div className="flex gap-2">
            {audiences.map((aud) => (
              <button
                key={aud.id}
                onClick={() => setSelectedAudience(aud.id)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-center transition-colors ${
                  selectedAudience === aud.id
                    ? 'bg-[#D63384] text-white'
                    : 'bg-white border border-border text-foreground hover:bg-[#F8BBD0]/20'
                }`}
              >
                <p className="text-sm font-medium">{aud.label}</p>
                <p className={`text-xs mt-0.5 ${selectedAudience === aud.id ? 'text-white/80' : 'text-muted-foreground'}`}>{aud.count} clients</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message Composer */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3 text-sm text-foreground bg-transparent resize-none focus:outline-none min-h-[120px]"
              maxLength={1000}
            />
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/50">
              <span className="text-xs text-muted-foreground">{message.length}/1000</span>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#D63384] hover:text-[#AD1457] transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Preview */}
        {showPreview && message && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">WhatsApp Preview</h3>
            <div className="bg-[#E5DDD5] rounded-2xl p-4">
              <div className="max-w-[280px]">
                <div className="bg-[#DCF8C6] rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <p className="text-xs font-semibold text-[#075E54] mb-1">The Wellness Hub</p>
                  <p className="text-sm text-[#303030] whitespace-pre-wrap">{message}</p>
                  <p className="text-[10px] text-[#999] text-right mt-1">
                    {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!message.trim()}
          className="w-full py-3.5 bg-[#D63384] text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#AD1457] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#D63384]/20"
        >
          <Send className="w-5 h-5" />
          Send to {selectedCount} clients via WhatsApp
        </button>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <div className="w-12 h-12 rounded-full bg-[#F8BBD0]/30 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-[#D63384]" />
              </div>
              <h3 className="text-lg font-bold text-foreground text-center mb-2">Send Broadcast?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This will send your message to <span className="font-semibold text-foreground">{selectedCount} clients</span> via WhatsApp. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 bg-[#D63384] text-white rounded-xl text-sm font-medium hover:bg-[#AD1457] transition-colors"
                >
                  Send Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Past Broadcasts */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Previous Messages</h3>
          <div className="space-y-2">
            {pastBroadcasts.map((msg, i) => (
              <div key={i} className="bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm text-foreground line-clamp-1 flex-1 pr-3">{msg.preview}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] shrink-0">{msg.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{msg.date}</p>
                  <p className="text-xs text-muted-foreground">Sent to {msg.sentTo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
