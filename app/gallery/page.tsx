'use client'

import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
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

  // Touch tracking for swipe
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const isSwiping = useRef<boolean>(false)

  const goPrev = () => setLightbox(i => (i !== null && i > 0 ? i - 1 : i))
  const goNext = () => setLightbox(i => (i !== null && i < GALLERY.length - 1 ? i + 1 : i))

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      setLightbox(null)
      if (e.key === 'ArrowLeft')   goPrev()
      if (e.key === 'ArrowRight')  goNext()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchStartY.current = e.targetTouches[0].clientY
    isSwiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = Math.abs(e.targetTouches[0].clientX - touchStartX.current)
    const diffY = Math.abs(e.targetTouches[0].clientY - touchStartY.current)
    if (diffX > diffY && diffX > 10) {
      isSwiping.current = true
      e.stopPropagation()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Our Studio</h1>
            <p className="text-xs text-muted-foreground">{GALLERY.length} photos</p>
          </div>
        </div>
      </div>

      {/* Grid — rectangular cards (taller) instead of perfect squares */}
      <div className="px-3 pt-3 grid grid-cols-2 gap-2">
        {GALLERY.map((item, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="relative rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            style={{ aspectRatio: '4/5' }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 300px"
              loading={i < 4 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <p className="absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-semibold text-white text-left leading-tight">
              {item.caption}
            </p>
          </button>
        ))}
      </div>

      {/* Lightbox with swipe */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/97 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-4 text-xs text-white/60 font-medium">
            {lightbox + 1} / {GALLERY.length}
          </span>

          {/* Image */}
          <div
            className="relative w-full h-[78vh] mx-2"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={GALLERY[lightbox].src}
              alt={GALLERY[lightbox].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Caption */}
          <p className="absolute bottom-14 text-sm text-white/80 font-medium px-6 text-center w-full">
            {GALLERY[lightbox].caption}
          </p>

          {/* Prev arrow */}
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); goPrev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next arrow */}
          {lightbox < GALLERY.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); goNext() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:bg-white/25 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-4 flex gap-1.5 flex-wrap justify-center px-8">
            {GALLERY.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightbox(i) }}
                className={`h-1.5 rounded-full transition-all ${
                  i === lightbox ? 'bg-white w-5' : 'bg-white/35 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
