'use client'

import { ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/bottom-nav'

const GALLERY = [
  { src: '/images/venue/outdoor.jpg',            alt: 'Outdoor rooftop studio',    caption: 'Our Rooftop Studio' },
  { src: '/images/venue/indoor.jpg',             alt: 'Indoor studio',             caption: 'Indoor Practice Hall' },
  { src: '/images/classes/yoga.jpg',             alt: 'Yoga class in session',     caption: 'Yoga Flow Sessions' },
  { src: '/images/trainer/enjy-stretch.jpg',     alt: 'Enjy demonstrating a pose', caption: 'Enjy in Action' },
  { src: '/images/classes/meditation.jpg',       alt: 'Meditation practice',       caption: 'Meditation & Mindfulness' },
  { src: '/images/community/group-large.jpg',    alt: 'Our community',             caption: 'Our Community' },
  { src: '/images/classes/soundhealing.jpg',     alt: 'Sound healing session',     caption: 'Sound Healing' },
  { src: '/images/classes/savasana.jpg',         alt: 'Savasana relaxation',       caption: 'Deep Relaxation' },
  { src: '/images/trainer/enjy-gentle.jpg',      alt: 'Enjy gentle practice',      caption: 'Gentle Practice' },
  { src: '/images/community/group-small.jpg',    alt: 'Group at studio entrance',  caption: 'Align Family' },
  { src: '/images/classes/stretching.jpg',       alt: 'Stretching class',          caption: 'Gentle Stretching' },
  { src: '/images/community/bowls-group.jpg',    alt: 'Sound bowls gathering',     caption: 'Sound Bath Circle' },
  { src: '/images/classes/sidebend.jpg',         alt: 'Side bend class',           caption: 'Flow & Flexibility' },
  { src: '/images/venue/class-wide.jpg',         alt: 'Full class wide shot',      caption: 'Sound Bath Session' },
  { src: '/images/community/group-outdoor.jpg',  alt: 'Large group outdoor',       caption: 'Growing Together' },
  { src: '/images/community/celebration.jpg',    alt: 'Studio celebration',        caption: 'Celebrating Together' },
  { src: '/images/trainer/enjy-portrait.jpg',    alt: 'Enjy Gebril portrait',      caption: 'Trainer Enjy Gebril' },
]

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox])

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Our Studio</h1>
            <p className="text-xs text-muted-foreground">See where the magic happens</p>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 grid grid-cols-2 gap-2">
        {GALLERY.map((item, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="relative aspect-square rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 300px"
              loading={i < 4 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-semibold text-white text-left leading-tight">
              {item.caption}
            </p>
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative w-full max-w-2xl aspect-square" onClick={e => e.stopPropagation()}>
            <Image
              src={GALLERY[lightbox].src}
              alt={GALLERY[lightbox].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium bg-black/50 py-2 backdrop-blur-sm">
              {GALLERY[lightbox].caption}
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
