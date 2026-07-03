'use client'

// ── Retreats ───────────────────────────────────────────────────
// Standalone page (moved out of Explore). Opened from the glowing
// "Retreats ✨" item in the user menu.

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'

type Retreat = {
  id: string
  title: string
  description: string
  location: string
  date: string
  end_date: string | null
  price: number | null
  capacity: number | null
  cover_image: string | null
}

export default function RetreatsPage() {
  const [retreats, setRetreats] = useState<Retreat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('retreats')
      .select('id, title, description, location, date, end_date, price, capacity, cover_image')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (data) setRetreats(data)
        setLoading(false)
      })
  }, [])

  return (
    <main className="bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Retreats 🌍</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : retreats.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No upcoming retreats</p>
            <p className="text-sm text-muted-foreground">Check back soon for new retreat announcements.</p>
          </div>
        ) : (
          retreats.map(r => (
            <Link key={r.id} href={`/retreats/${r.id}`}>
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                {r.cover_image ? (
                  <div className="relative h-44 w-full">
                    <Image src={r.cover_image} alt={r.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 bg-[#006D77] text-white text-xs font-semibold rounded-lg">
                        Retreat
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-br from-[#006D77] to-[#004E5C] flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-1">{r.title}</h3>
                  {r.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />{r.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {r.end_date && ` – ${new Date(r.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#006D77]">
                      {r.price ? `EGP ${r.price.toLocaleString()}` : 'Price TBA'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#006D77] font-medium">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  )
}
