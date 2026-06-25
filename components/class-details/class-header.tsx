'use client'

import { ArrowLeft, Share2 } from 'lucide-react'
import Link from 'next/link'

export function ClassHeader() {
  const handleShare = async () => {
    const shareData = {
      title: 'Power Yoga — The Wellness Hub',
      text: 'Join me for Power Yoga at The Wellness Hub! Sunday at 11:00 AM',
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied!')
      }
    } catch (err) {
      console.log('Share cancelled')
    }
  }

  return (
    <div className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] h-52 relative flex items-center justify-center">
      <Link href="/schedule" className="absolute top-6 left-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all">
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      <div className="text-7xl">🧘‍♀️</div>

      <button onClick={handleShare} className="absolute top-6 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all">
        <Share2 className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}
