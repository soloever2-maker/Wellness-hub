'use client'

// ── Post-class review prompt ───────────────────────────────────
// Appears on home for up to 48h after a class the client attended,
// inviting them to leave a review. Dismissible, and hides itself
// once a review for that class has been submitted.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const WINDOW_HOURS = 48

export function ReviewPromptBanner() {
  const [prompt, setPrompt] = useState<{ bookingId: string; className: string } | null>(null)

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser()
      if (!user) return

      const now = Date.now()

      const { data } = await supabase
        .from('bookings')
        .select('id, status, session:class_sessions(start_time, end_time, class_type:class_types(name))')
        .eq('client_id', user.id)
        .in('status', ['attended', 'confirmed'])

      // Most recent class that ended within the window
      const candidates = ((data || []) as any[])
        .filter(b => {
          const end = b.session?.end_time ? new Date(b.session.end_time).getTime() : 0
          return end < now && now - end < WINDOW_HOURS * 3_600_000 && b.session?.class_type?.name
        })
        .sort((a, b) => b.session.end_time.localeCompare(a.session.end_time))

      if (candidates.length === 0) return
      const cand = candidates[0]

      // Dismissed before?
      try {
        if (localStorage.getItem(`review_prompt_${cand.id}`)) return
      } catch { /* ignore */ }

      // Already reviewed this class since it started?
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('client_id', user.id)
        .eq('type', 'review')
        .eq('class_type', cand.session.class_type.name)
        .gte('created_at', cand.session.start_time)
        .limit(1)

      if (existing?.length) return

      setPrompt({ bookingId: cand.id, className: cand.session.class_type.name })
    }
    run()
  }, [])

  if (!prompt) return null

  const dismiss = () => {
    try { localStorage.setItem(`review_prompt_${prompt.bookingId}`, '1') } catch { /* ignore */ }
    setPrompt(null)
  }

  return (
    <div className="relative bg-white border border-[#F5A623]/30 rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
      <button onClick={dismiss}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
      <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center shrink-0">
        <Star className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
      </div>
      <div className="flex-1 min-w-0 pr-5">
        <p className="font-bold text-foreground text-sm leading-tight">
          How was {prompt.className}? ⭐
        </p>
        <Link
          href={`/explore?tab=reviews&write=1&class=${encodeURIComponent(prompt.className)}`}
          onClick={() => { try { localStorage.setItem(`review_prompt_${prompt.bookingId}`, '1') } catch { /* ignore */ } }}
          className="text-xs font-semibold text-[#006D77] underline underline-offset-2"
        >
          Leave a quick review
        </Link>
      </div>
    </div>
  )
}
