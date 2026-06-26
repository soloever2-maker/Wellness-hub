'use client'

import { useEffect } from 'react'

export function PWAInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          // Force check for updates immediately
          reg.update().catch(() => {})
        })
        .catch(() => {})
    }
  }, [])
  return null
}
