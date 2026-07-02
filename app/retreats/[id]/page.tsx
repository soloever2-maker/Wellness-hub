'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Calendar, Users, ArrowLeft, CheckCircle, Loader2, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

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

export default function RetreatPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params?.id as string

  const [retreat,   setRetreat]   = useState<Retreat | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [userId,    setUserId]    = useState<string | null>(null)
  const [interest,  setInterest]  = useState<'idle' | 'loading' | 'done'>('idle')
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    // Public — load retreat without auth
    supabase
      .from('retreats')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single()
      .then(({ data }) => {
        setRetreat(data)
        setLoading(false)
      })

    // Optional: check if logged in
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }, [id])

  const handleInterest = async () => {
    if (!userId) { router.push('/login?redirect=/retreats/' + id); return }
    setInterest('loading')
    await supabase.from('retreat_interests').upsert({
      retreat_id: id, client_id: userId
    }, { onConflict: 'retreat_id,client_id' })
    setInterest('done')
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: retreat?.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-full border-4 border-[#006D77] border-t-transparent animate-spin" />
    </div>
  )

  if (!retreat) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6 text-center">
      <p className="text-lg font-bold text-foreground">Retreat not found</p>
      <p className="text-sm text-muted-foreground">This retreat may have been removed or is no longer available.</p>
      <Link href="/explore" className="text-sm text-[#006D77] font-medium">← Back to Explore</Link>
    </div>
  )

  const dateStr = new Date(retreat.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const endDateStr = retreat.end_date
    ? new Date(retreat.end_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <main className="bg-background min-h-screen pb-10">
      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden">
        {retreat.cover_image ? (
          <Image src={retreat.cover_image} alt={retreat.title} fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#006D77] to-[#004E5C]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          {copied
            ? <CheckCircle className="w-5 h-5 text-white" />
            : <Share2 className="w-5 h-5 text-white" />
          }
        </button>

        <div className="absolute bottom-4 left-4">
          <span className="px-2.5 py-1 bg-[#006D77] text-white text-xs font-bold rounded-lg mb-2 inline-block">Retreat</span>
          <h1 className="text-xl font-bold text-white drop-shadow">{retreat.title}</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Info cards */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {[
            { icon: Calendar, label: 'Date',     value: endDateStr ? `${dateStr} – ${endDateStr}` : dateStr },
            { icon: MapPin,   label: 'Location', value: retreat.location || 'TBA' },
            { icon: Users,    label: 'Capacity', value: retreat.capacity ? `${retreat.capacity} spots` : 'Open' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3.5 ${i < 2 ? 'border-b border-border' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-[#E0EEF0] flex items-center justify-center flex-shrink-0 mt-0.5">
                <item.icon className="w-4 h-4 text-[#006D77]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        {retreat.description && (
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-foreground mb-2">About This Retreat</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {retreat.description}
            </p>
          </div>
        )}

        {/* Price + CTA */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-xl font-bold text-[#006D77]">
                {retreat.price ? `EGP ${retreat.price.toLocaleString()}` : 'To be announced'}
              </p>
            </div>
          </div>

          {interest === 'done' ? (
            <div className="flex items-center justify-center gap-2 py-4 bg-[#006D77]/5 rounded-xl">
              <CheckCircle className="w-5 h-5 text-[#006D77]" />
              <p className="text-sm font-semibold text-[#006D77]">Interest registered! Enjy will reach out soon.</p>
            </div>
          ) : (
            <button
              onClick={handleInterest}
              disabled={interest === 'loading'}
              className="w-full py-3.5 bg-[#006D77] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              {interest === 'loading'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : "I'm Interested"
              }
            </button>
          )}

          {!userId && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              <Link href="/login" className="text-[#006D77] font-medium">Sign in</Link> to register your interest
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
