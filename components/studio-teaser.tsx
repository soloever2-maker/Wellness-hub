'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function StudioTeaser() {
  return (
    <div className="rounded-3xl overflow-hidden shadow-sm border border-border bg-white">
      {/* Hero image */}
      <div className="relative w-full aspect-[16/10] bg-muted">
        <Image
          src="/images/trainer/enjy-hero.jpg"
          alt="Enjy Gebril — Wellness & Yoga"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
          priority
        />
        {/* Soft gradient at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-xl font-bold drop-shadow-md">Align with Enjy</h3>
          <p className="text-white/90 text-sm drop-shadow-md">Wellness & Yoga · Ladies Only</p>
        </div>
      </div>

      {/* Explore button */}
      <Link href="/gallery"
        className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
        <div>
          <p className="font-semibold text-foreground text-sm">Explore Our Studio</p>
          <p className="text-xs text-muted-foreground mt-0.5">See photos of the space and community</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#006D77] flex items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </Link>
    </div>
  )
}
