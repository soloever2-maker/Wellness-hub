'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const GALLERY = [
  { src: '/images/venue/outdoor.jpg',            alt: 'Outdoor rooftop studio',    caption: 'Our Rooftop Studio' },
  { src: '/images/venue/indoor.jpg',             alt: 'Indoor studio',             caption: 'Indoor Practice Hall' },
  { src: '/images/classes/yoga.jpg',             alt: 'Yoga class in session',     caption: 'Yoga Flow Sessions' },
  { src: '/images/trainer/enjy-stretch.jpg',     alt: 'Enjy demonstrating a pose', caption: 'Enjy in Action' },
  { src: '/images/classes/meditation.jpg',       alt: 'Meditation practice',       caption: 'Meditation & Mindfulness' },
  { src: '/images/community/group-large.jpg',    alt: 'Our community',            caption: 'Our Community' },
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

export function StudioGallery() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    el?.addEventListener('scroll', checkScroll, { passive: true })
    return () => el?.removeEventListener('scroll', checkScroll)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' })
  }

  // Close lightbox on back
  useEffect(() => {
    if (lightbox === null) return
    const close = () => setLightbox(null)
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [lightbox])

  return (
    <>
      <section className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Our Studio</h2>
            <p className="text-xs text-muted-foreground">See where the magic happens</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Gallery */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {GALLERY.map((item, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="flex-shrink-0 snap-start group relative rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
              style={{ width: 220, height: 160 }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover group-active:scale-105 transition-transform duration-300"
                sizes="220px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-2.5 left-3 text-xs font-semibold text-white">
                {item.caption}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Image */}
          <div
            className="relative w-full h-[70vh] mx-4"
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
          <p className="absolute bottom-8 text-sm text-white/80 font-medium">
            {GALLERY[lightbox].caption}
          </p>

          {/* Nav */}
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {lightbox < GALLERY.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 flex gap-1.5">
            {GALLERY.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightbox(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === lightbox ? 'bg-white w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
