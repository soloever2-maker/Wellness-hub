'use client'

// ── Clients Reviews ────────────────────────────────────────────
// Standalone page (moved out of Explore). Opened from the
// "Clients Reviews" item in the side menu. Read-only community
// wall — writing a review lives at /reviews/write.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, PenLine, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'

type Review = {
  id: string
  rating: number | null
  class_type: string | null
  comment: string
  created_at: string
  client: { full_name: string } | null
}

export default function ClientsReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, rating, class_type, comment, created_at, client:users(full_name)')
      .eq('type', 'review')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setReviews(data as unknown as Review[])
        setLoading(false)
      })
  }, [])

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null

  return (
    <main className="bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Clients Reviews ⭐</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* Summary + CTA */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              {avg ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold text-foreground">{avg}</span>
                    <Star className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">Be the first to review ⭐</p>
              )}
            </div>
            <Link
              href="/reviews/write"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#006D77] text-white text-xs font-semibold active:scale-[0.97] transition-all"
            >
              <PenLine className="w-3.5 h-3.5" />
              Review Your Class
            </Link>
          </div>
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Star className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground px-8">
              Took a class with Enjy? Tell the community how it went!
            </p>
          </div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#E0EEF0] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#006D77]">
                      {(r.client?.full_name || 'A').slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.client?.full_name?.split(' ')[0] || 'A member'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.rating || 0) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-border'}`} />
                  ))}
                </div>
              </div>
              {r.class_type && (
                <span className="inline-block text-[10px] font-semibold text-[#006D77] bg-[#E0EEF0] px-2 py-0.5 rounded-full mb-2">
                  {r.class_type}
                </span>
              )}
              <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  )
}
