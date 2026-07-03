'use client'

import Image from 'next/image'
import { Globe, ArrowUpRight } from 'lucide-react'

const ENJY_IMG = '/images/trainer/enjy-class-aswan.jpg'
const ENJY_SITE = 'https://soloever2-maker.github.io/Enjy-FlowWA/'

const certs = ['RYT-500 Yoga Alliance', 'YACEP Continuing Education', 'Therapeutic Yoga 860h', 'Yin Yoga 100h']

export function TrainerCard() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Photo */}
      <div className="relative h-52 w-full">
        <Image
          src={ENJY_IMG}
          alt="Enjy Gebril"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#006D77]/80 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <p className="text-xs font-medium text-white/80">Your Trainer</p>
          <h3 className="text-lg font-bold">Enjy Gebril</h3>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <p className="text-xs font-bold text-[#006D77]">⭐ 5.0 · Google</p>
        </div>
      </div>

      {/* Bio */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Certified yoga therapist & multi-style instructor. Dedicated to empowering women through movement, mindfulness, and wellness.
        </p>

        {/* Certs */}
        <div className="flex flex-wrap gap-1.5">
          {certs.map(c => (
            <span key={c} className="text-[10px] font-medium px-2 py-1 bg-[#E0EEF0] text-[#006D77] rounded-full">
              {c}
            </span>
          ))}
        </div>

        {/* Website link */}
        
          href={ENJY_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full p-3 bg-[#006D77]/[0.04] border border-[#006D77]/15 rounded-2xl active:scale-[0.99] hover:bg-[#006D77]/[0.07] transition-all"
        >
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#006D77] to-[#004E5C] flex items-center justify-center shrink-0 shadow-sm">
            <Globe className="w-[18px] h-[18px] text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-foreground">Visit Enjy&apos;s Website</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">Programs, retreats & more</span>
          </span>
          <span className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 text-[#006D77]" />
          </span>
        </a>
      </div>
    </div>
  )
}
