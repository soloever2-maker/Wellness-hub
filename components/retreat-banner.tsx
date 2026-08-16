'use client'

// ============================================================
// Home-page banner that surfaces the latest PUBLISHED retreat.
// Renders nothing when there is no published retreat, so it is
// safe to always mount on the home screen.
//   → components/retreat-banner.tsx  (new file)
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
      className="block relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
    >
      {/* Background */}
      {retreat.cover_image ? (
        <img
          src={retreat.cover_image}
          alt={retreat.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #006D77 0%, #B8612A 100%)' }} />
      )}
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

      <div className="relative p-4 min-h-[128px] flex flex-col justify-between">
        <div className="flex items-center gap-1.5 self-start bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] font-bold text-white tracking-wide uppercase">New Retreat</span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white leading-tight mb-1">{retreat.title}</h3>
          <div className="flex items-center gap-3 text-white/90 text-xs">
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
        </div>

        <div className="flex items-center gap-1 self-end text-white text-sm font-semibold">
          View details <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
