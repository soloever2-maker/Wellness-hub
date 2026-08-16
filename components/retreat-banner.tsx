'use client'

// ============================================================
// Home-page banner that surfaces the latest PUBLISHED retreat.
// Renders nothing when there is no published retreat, so it is
// safe to always mount on the home screen.
//   → components/retreat-banner.tsx
// ============================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, CalendarDays, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Retreat {
  id: string
  title: string
  location: string | null
  date: string | null
  end_date: string | null
  cover_image: string | null
}

export function RetreatBanner() {
  const [retreat, setRetreat] = useState<Retreat | null>(null)

  useEffect(() => {
    supabase
      .from('retreats')
      .select('id, title, location, date, end_date, cover_image')
      .eq('status', 'published')
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setRetreat(data as Retreat | null))
  }, [])

  if (!retreat) return null

  const dateLabel = retreat.date
    ? new Date(retreat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <Link
      href={`/retreats/${retreat.id}`}
      className="block overflow-hidden rounded-2xl shadow-lg active:scale-[0.98] transition-transform bg-white border border-border"
    >
      {/* Full image — shown complete, not cropped */}
      <div className="w-full bg-gradient-to-br from-[#006D77] to-[#B8612A] flex items-center justify-center">
        {retreat.cover_image ? (
          <img
            src={retreat.cover_image}
            alt={retreat.title}
            className="w-full max-h-56 object-contain"
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white/80" />
          </div>
        )}
      </div>

      {/* Info bar under the image */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-1 bg-[#B8612A]/10 text-[#B8612A] px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-wide uppercase">New Retreat</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-foreground leading-tight mb-1.5">{retreat.title}</h3>

        <div className="flex items-center gap-3 text-muted-foreground text-xs mb-3">
          {retreat.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {retreat.location}
            </span>
          )}
          {dateLabel && (
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> {dateLabel}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #006D77 0%, #004E5C 100%)' }}>
          View details <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
