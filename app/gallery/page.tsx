'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StudioGallery } from '@/components/studio-gallery'
import { BottomNav } from '@/components/bottom-nav'

export default function GalleryPage() {
  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Our Studio</h1>
            <p className="text-xs text-muted-foreground">A glimpse into the space</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <StudioGallery />
      </div>

      <BottomNav />
    </main>
  )
}
