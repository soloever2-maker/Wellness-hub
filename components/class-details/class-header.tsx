'use client'

import { ArrowLeft, Share2, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/** Map class‑type names → local photos */
const CLASS_IMAGES: Record<string, string> = {
  'Power Yoga':              '/images/classes/yoga.jpg',
  'Mat Pilates':             '/images/classes/stretching.jpg',
  'Gentle Yoga & Recovery':  '/images/classes/meditation.jpg',
  'Belly Rhythmic Dancing':  '/images/classes/sidebend.jpg',
  'Aqua Aerobics':           '/images/venue/outdoor.jpg',
}
const FALLBACK_IMG = '/images/classes/yoga.jpg'

export function ClassHeader() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  const [className, setClassName] = useState('')

  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('sessions')
      .select('class_type:class_types(name)')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        if (data?.class_type) setClassName((data.class_type as any).name ?? '')
      })
  }, [sessionId])

  const imgSrc = CLASS_IMAGES[className] || FALLBACK_IMG

  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: `${className || 'Class'} — Align with Enjy`,
      text: `Join me for ${className || 'a class'} at Align with Enjy!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* share cancelled */ }
  }

  return (
    <div className="relative h-52 w-full overflow-hidden">
      {/* Background photo */}
      <Image
        src={imgSrc}
        alt={className || 'Class'}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

      {/* Back */}
      <Link href="/schedule" className="absolute top-6 left-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-all z-10">
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      {/* Class name */}
      {className && (
        <div className="absolute bottom-4 left-4 z-10">
          <p className="text-2xl font-bold text-white drop-shadow-lg">{className}</p>
        </div>
      )}

      {/* Share */}
      <button onClick={handleShare} className="absolute top-6 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-all z-10 flex items-center gap-1.5">
        {copied
          ? <><Check className="w-5 h-5 text-white" /><span className="text-white text-xs font-medium pr-1">Copied</span></>
          : <Share2 className="w-5 h-5 text-white" />
        }
      </button>
    </div>
  )
}
