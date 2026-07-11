'use client'

// ── Side Menu (client app) ─────────────────────────────────────
// Slide-in drawer opened from the ☰ button in the TopBar.
// Home of: Retreats (glowing), Clients Reviews, Add Review,
// and the Align with Enjy website link.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X, MapPin, Star, PenLine, Globe, ChevronRight } from 'lucide-react'

const ENJY_WEBSITE_URL = 'https://enjy-flow-wa.vercel.app/'

export function SideMenu() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  const close = () => setOpen(false)

  const itemClass =
    'flex items-center gap-3.5 px-5 py-4 active:bg-muted/60 transition-colors'

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Overlay + Drawer — portaled to <body> so it escapes the
          TopBar's z-30 stacking context (fixes tabs showing above it) */}
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={close}
          />

          {/* Panel */}
          <div className="absolute top-0 right-0 h-full w-[78%] max-w-xs bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">

            {/* Header */}
            <div className="px-5 pt-6 pb-5 border-b border-border relative"
              style={{ background: 'linear-gradient(135deg, #E0EEF0 0%, #EDD7C9 100%)' }}>
              <button onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#006D77]/70">
                Align with Enjy
              </p>
              <h2 className="text-lg font-bold text-foreground mt-0.5">Explore More 🌿</h2>
            </div>

            {/* Items */}
            <nav className="flex-1 py-2 overflow-y-auto">

              {/* Retreats — the glowing star of the menu */}
              <Link href="/retreats" onClick={close} className={itemClass}>
                <span className="relative flex w-9 h-9 items-center justify-center rounded-xl bg-[#EDD7C9]/40 shrink-0">
                  <span className="absolute inline-flex w-7 h-7 rounded-xl bg-[#B8612A]/30 animate-ping" />
                  <MapPin className="w-4.5 h-4.5 w-[18px] h-[18px] text-[#B8612A] relative" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold bg-gradient-to-r from-[#B8612A] to-[#006D77] bg-clip-text text-transparent">
                    Retreats ✨
                  </p>
                  <p className="text-[11px] text-muted-foreground">Escape with Enjy — upcoming trips</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* Clients Reviews */}
              <Link href="/reviews" onClick={close} className={itemClass}>
                <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-[#F5A623]/10 shrink-0">
                  <Star className="w-[18px] h-[18px] text-[#F5A623] fill-[#F5A623]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Clients Reviews</p>
                  <p className="text-[11px] text-muted-foreground">What the community says</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* Add Review */}
              <Link href="/reviews/write" onClick={close} className={itemClass}>
                <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-[#E0EEF0] shrink-0">
                  <PenLine className="w-[18px] h-[18px] text-[#006D77]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Review Your Class</p>
                  <p className="text-[11px] text-muted-foreground">Share your experience ⭐</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              <div className="h-px bg-border mx-5 my-2" />

              {/* Website */}
              <a href={ENJY_WEBSITE_URL} target="_blank" rel="noopener noreferrer"
                onClick={close} className={itemClass}>
                <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-muted shrink-0">
                  <Globe className="w-[18px] h-[18px] text-foreground" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Align with Enjy Website</p>
                  <p className="text-[11px] text-muted-foreground">Visit our website</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Made with 🤍 for the Align with Enjy community
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
