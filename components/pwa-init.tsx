'use client'

import { useEffect, useState } from 'react'
import { playSingingBowl } from '@/lib/sounds'
import { useRouter } from 'next/navigation'
import { RefreshCw, Bell, X } from 'lucide-react'

type InAppNotif = { title: string; body: string }

export function PWAInit() {
  const router = useRouter()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [inAppNotif, setInAppNotif] = useState<InAppNotif | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let newWorker: ServiceWorker | null = null

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
        reg.update().catch(() => {})
        const interval = setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000)
        return () => clearInterval(interval)
      })
      .catch(() => {})

    // Handle SW messages
    const handleMessage = (event: MessageEvent) => {
      // Push received → play sound + show in-app banner + increment counter
      if (event.data?.type === 'PUSH_RECEIVED') {
        playSingingBowl(0.4)

        // Increment unread counter
        const current = parseInt(localStorage.getItem('notifs_unread') || '0')
        localStorage.setItem('notifs_unread', String(current + 1))
        window.dispatchEvent(new Event('notifs_updated'))

        // Show in-app banner
        setInAppNotif({ title: event.data.title || 'New Message', body: event.data.body || '' })
        setTimeout(() => setInAppNotif(null), 5000)
      }

      // Legacy sound-only message
      if (event.data?.type === 'PLAY_SOUND') {
        playSingingBowl(0.4)
      }

      // Navigate
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        router.push(event.data.url)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; window.location.reload() }
    })

    return () => { navigator.serviceWorker.removeEventListener('message', handleMessage) }
  }, [router])

  const handleUpdate = () => {
    setRefreshing(true)
    navigator.serviceWorker.ready.then((reg) => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
    })
  }

  return (
    <>
      {/* Update Banner */}
      {updateAvailable && (
        <div className="fixed top-4 left-4 right-4 z-[300]">
          <div className="bg-[#006D77] text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Update Available</p>
              <p className="text-xs text-white/75">A new version is ready</p>
            </div>
            <button onClick={handleUpdate} disabled={refreshing}
              className="px-4 py-2 bg-white text-[#006D77] text-sm font-bold rounded-xl disabled:opacity-60">
              {refreshing ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      )}

      {/* In-App Notification Banner */}
      {inAppNotif && (
        <div className="fixed top-4 left-4 right-4 z-[299] animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white border border-border rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E0EEF0] flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-[#006D77]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{inAppNotif.title}</p>
              {inAppNotif.body && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{inAppNotif.body}</p>
              )}
            </div>
            <button onClick={() => setInAppNotif(null)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
