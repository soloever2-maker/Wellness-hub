'use client'

// ── Review Your Class ──────────────────────────────────────────
// Standalone page (moved out of Explore). Opened from the
// "Review Your Class" item in the side menu, the post-class
// prompt banner, and past bookings.
// Deep link: /reviews/write?class=Power%20Yoga

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, Star, CheckCircle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export default function WriteReviewPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  // Classes this client actually attended (only these can be reviewed)
  const [reviewableClasses, setReviewableClasses] = useState<string[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  const [form, setForm] = useState({ type: 'review', rating: 5, classType: '', comment: '' })
  const [status, setStatus] = useState<RequestStatus>('idle')

  useEffect(() => {
    // Deep link: /reviews/write?class=Power%20Yoga
    try {
      const params = new URLSearchParams(window.location.search)
      const cls = params.get('class')
      if (cls) setForm(f => ({ ...f, classType: cls }))
    } catch { /* ignore */ }

    getCurrentUser().then(async u => {
      if (!u) { setLoadingClasses(false); return }
      setUserId(u.id)

      // Classes the client attended (or booked and the class already ended)
      const { data: past } = await supabase
        .from('bookings')
        .select('status, session:class_sessions(end_time, class_type:class_types(name))')
        .eq('client_id', u.id)
        .in('status', ['attended', 'confirmed'])
      const now = Date.now()
      const names = new Set<string>()
      for (const b of (past || []) as any[]) {
        const name = b.session?.class_type?.name
        const ended = b.session?.end_time && new Date(b.session.end_time).getTime() < now
        if (name && (b.status === 'attended' || ended)) names.add(name)
      }
      setReviewableClasses(Array.from(names))
      setLoadingClasses(false)
    })
  }, [])

  const handleSubmit = async () => {
    if (!userId) { router.push('/login'); return }
    if (!form.comment.trim()) return
    if (form.type === 'review' && !form.classType) return
    setStatus('loading')
    const { error } = await supabase.from('reviews').insert({
      client_id: userId,
      type: form.type,
      rating: form.type === 'review' ? form.rating : null,
      class_type: form.type === 'review' ? form.classType : null,
      comment: form.comment.trim(),
      is_approved: false,
    })
    setStatus(error ? 'error' : 'success')

    if (!error) {
      // Ping Enjy (best-effort — never blocks the user)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        fetch('/api/push/notify-admins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            kind: form.type,
            rating: form.rating,
            class_type: form.classType || null,
          }),
        }).catch(() => {})
      } catch { /* ignore */ }
    }
  }

  return (
    <main className="bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (window.history.length > 1) router.back(); else router.push('/') }}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Share Your Experience ✨</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
        {status === 'success' ? (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center py-10 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <p className="font-bold text-foreground">Thank you! 🤍</p>
            <p className="text-sm text-muted-foreground px-4">
              {form.type === 'review'
                ? 'Your review was sent and will appear on Clients Reviews once approved.'
                : 'Your message was sent to Enjy directly.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {form.type === 'review' && (
                <Link href="/reviews"
                  className="px-5 py-2.5 rounded-full border border-[#006D77] text-[#006D77] text-sm font-semibold">
                  Clients Reviews
                </Link>
              )}
              <Link href="/"
                className="px-6 py-2.5 rounded-full bg-[#006D77] text-white text-sm font-semibold">
                Done
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'review', label: '⭐ Review a Class' },
                { id: 'suggestion', label: '💡 Suggestion' },
                { id: 'feedback', label: '💬 Feedback' },
              ] as const).map(t => (
                <button key={t.id}
                  onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  className={`py-2.5 px-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                    form.type === t.id
                      ? 'bg-[#006D77] text-white border-[#006D77]'
                      : 'bg-white text-foreground border-border'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {form.type === 'review' && loadingClasses ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
              </div>
            ) : form.type === 'review' && reviewableClasses.length === 0 ? (
              <div className="bg-[#EDD7C9]/25 border border-[#B8612A]/15 rounded-xl px-4 py-4 text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Attend a class first 🧘‍♀️</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reviews can only be written for classes you&apos;ve attended.
                  Book your next session and come back to share your experience!
                </p>
              </div>
            ) : form.type === 'review' ? (
              <>
                {/* Stars */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}>
                        <Star className={`w-8 h-8 transition-colors ${n <= form.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-border'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Class type */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Which class?</label>
                  <select
                    value={form.classType}
                    onChange={e => setForm(f => ({ ...f, classType: e.target.value }))}
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                  >
                    <option value="">Select a class you attended...</option>
                    {reviewableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground bg-[#E0EEF0]/50 rounded-xl px-3 py-2.5">
                {form.type === 'suggestion'
                  ? '💡 Ideas for classes, schedules, or packages — goes to Enjy privately.'
                  : '💬 Anything on your mind — goes to Enjy privately, not published.'}
              </p>
            )}

            {/* Comment */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                {form.type === 'review' ? 'Your review' : 'Your message'}
              </label>
              <textarea
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder={form.type === 'review' ? 'How was your experience?' : 'Tell Enjy what you think...'}
                rows={4}
                className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || !form.comment.trim() || (form.type === 'review' && (!form.classType || reviewableClasses.length === 0))}
              className="w-full py-3.5 bg-[#006D77] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
