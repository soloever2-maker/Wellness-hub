'use client'

// ── Pre-class banner ───────────────────────────────────────────
// Shows on the home screen ONLY when the client has a confirmed
// class starting within the next 3 hours. Links to /prepare.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const WINDOW_HOURS = 3

export function PrepareBanner() {
  const [show, setShow] = useState(false)
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser()
      if (!user) return

      const now = Date.now()

      const { data } = await supabase
        .from('bookings')
        .select('session:class_sessions(start_time)')
        .eq('client_id', user.id)
        .eq('status', 'confirmed')

      const starts = (data ?? [])
        .map((b: any) => b.session?.start_time)
        .filter(Boolean)
        .map((t: string) => new Date(t).getTime())
        .filter(t => t > now)
        .sort((a, b) => a - b)

      if (starts.length === 0) return
      const diffMs = starts[0] - now
      if (diffMs <= WINDOW_HOURS * 3_600_000) {
        setMinutesLeft(Math.floor(diffMs / 60_000))
        setShow(true)
      }
    }
    run()
  }, [])

  if (!show) return null

  const h = Math.floor((minutesLeft ?? 0) / 60)
  const m = (minutesLeft ?? 0) % 60
  const timeLabel = h > 0 ? `${h}h ${m}m` : `${m} min`

  return (
    <Link href="/prepare" className="block active:scale-[0.97] transition-all">
      <div className="relative rounded-2xl p-[2px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #B8612A, #006D77, #B8612A)' }}>
        <div className="relative rounded-[14px] px-4 py-3.5 flex items-center gap-3 bg-white">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-[#B8612A]/20 animate-ping" />
            <div className="w-10 h-10 rounded-xl bg-[#EDD7C9]/40 flex items-center justify-center relative">
              <Sparkles className="w-5 h-5 text-[#B8612A]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-tight">
              Class in {timeLabel} — let&apos;s get you ready ✨
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Water, mat, and a tip from Enjy
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#006D77] shrink-0" />
        </div>
      </div>
    </Link>
  )
}
