'use client'

// Native app update banner.
//
// Only relevant inside the native shell (iOS/Android). It reads the current
// installed build number from Capacitor's App plugin, compares it against
// /version.json (served from this site), and — if the installed build is
// older — shows a gentle banner linking to the store.
//
// Web/PWA users never see this (they always run the latest web deploy).

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

type VersionInfo = {
  latestBuild: { android: number; ios: number }
  message: { en: string; ar?: string }
  storeUrl: { android: string; ios: string }
}

const DISMISS_KEY = 'app_update_dismissed_build'

export function AppUpdateBanner() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [storeUrl, setStoreUrl] = useState('')

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        if (typeof window === 'undefined') return
        const cap = (window as any).Capacitor
        // Native shell only.
        if (!cap?.isNativePlatform?.()) return

        const platform: 'ios' | 'android' =
          cap.getPlatform?.() === 'android' ? 'android' : 'ios'

        // Current installed build number, via @capacitor/app.
        const AppPlugin = cap?.Plugins?.App
        if (!AppPlugin?.getInfo) return
        const info = await AppPlugin.getInfo()
        const currentBuild = parseInt(String(info?.build ?? '0'), 10)
        if (!currentBuild) return

        // Latest build from the server (cache-busted).
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data: VersionInfo = await res.json()

        const latest = data?.latestBuild?.[platform]
        if (typeof latest !== 'number') return

        // Already dismissed this exact build? Stay quiet.
        const dismissed = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)

        if (currentBuild < latest && dismissed < latest) {
          if (cancelled) return
          setMessage(data.message?.en || 'A new version is available. Please update.')
          setStoreUrl(data.storeUrl?.[platform] || '')
          setShow(true)
        }
      } catch {
        // Network / parsing issues → just don't show the banner.
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  const dismiss = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      const data: VersionInfo = await res.json()
      const cap = (window as any).Capacitor
      const platform: 'ios' | 'android' =
        cap?.getPlatform?.() === 'android' ? 'android' : 'ios'
      const latest = data?.latestBuild?.[platform]
      if (typeof latest === 'number') {
        localStorage.setItem(DISMISS_KEY, String(latest))
      }
    } catch { /* ignore */ }
    setShow(false)
  }

  const openStore = () => {
    if (storeUrl) window.open(storeUrl, '_blank')
  }

  if (!show) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[301]">
      <div className="bg-[#006D77] text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Update Available</p>
          <p className="text-xs text-white/80 line-clamp-2">{message}</p>
        </div>
        <button
          onClick={openStore}
          className="px-4 py-2 bg-white text-[#006D77] text-sm font-bold rounded-xl shrink-0"
        >
          Update
        </button>
        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
