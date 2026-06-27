'use client'

import { useEffect, useState } from 'react'
import { playSingingBowl } from '@/lib/sounds'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function PWAInit() {
  const router = useRouter()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let newWorker: ServiceWorker | null = null

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {

        // ── Detect update on fresh registration ──
        reg.addEventListener('updatefound', () => {
          newWorker = reg.installing

          newWorker?.addEventListener('statechange', () => {
            // New SW installed and waiting — show update banner
            if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })

        // ── Check for updates immediately + every 5 min ──
        reg.update().catch(() => {})
        const interval = setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000)
        return () => clearInterval(interval)
      })
      .catch(() => {})

    // ── Handle SW messages (sound + navigation) ──
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_SOUND' && event.data.sound === 'singing_bowl') {
        playSingingBowl(0.4)
      }
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        router.push(event.data.url)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    // ── When SW takes control (after skipWaiting) → reload ──
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [router])

  const handleUpdate = () => {
    setRefreshing(true)
    // Tell the waiting SW to take over
    navigator.serviceWorker.ready.then((reg) => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
    })
  }

  // ── Update banner ──
  if (!updateAvailable) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[300] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#006D77] text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Update Available</p>
          <p className="text-xs text-white/75">A new version of the app is ready</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={refreshing}
          className="px-4 py-2 bg-white text-[#006D77] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors shrink-0 disabled:opacity-60"
        >
          {refreshing ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  )
}