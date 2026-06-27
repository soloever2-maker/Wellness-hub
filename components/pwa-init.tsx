'use client'

import { useEffect } from 'react'
import { playSingingBowl } from '@/lib/sounds'
import { useRouter } from 'next/navigation'

export function PWAInit() {
  const router = useRouter()

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => { reg.update().catch(() => {}) })
        .catch(() => {})
    }

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_SOUND' && event.data.sound === 'singing_bowl') {
        // App is open → play singing bowl sound
        playSingingBowl(0.4)
      }
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        router.push(event.data.url)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage)
  }, [router])

  return null
}
