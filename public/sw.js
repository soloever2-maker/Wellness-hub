const CACHE_NAME = 'align-enjy-v4'
const STATIC_ASSETS = ['/manifest.json', '/icon.png', '/icon-192x192.png', '/icon-512x512.png']

// ── Skip waiting when told to ──────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('supabase.co')) return
  if (event.request.url.includes('/api/')) return

  const url = new URL(event.request.url)

  // Pages (navigate) → network only, no caching to avoid clone issues
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('/'))
      )
    )
    return
  }

  // Static assets → cache first
  if (STATIC_ASSETS.some(a => url.pathname === a) ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
          }
          return response
        }).catch(() => caches.match(event.request))
      })
    )
    return
  }

  // JS/CSS chunks → network first, cache fallback (no clone attempt for opaque responses)
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
      }
      return response
    }).catch(() => caches.match(event.request))
  )
})

// ── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try { data = event.data.json() }
  catch { data = { title: 'Align with Enjy', body: event.data.text() } }

  const { title = 'Align with Enjy', body = '', icon, badge, tag, data: extraData } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-96x96.png',
      tag: tag || 'align-notification',
      renotify: true,
      requireInteraction: false,
      data: extraData || {},
    }).then(() =>
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client =>
          client.postMessage({ type: 'PUSH_RECEIVED', sound: 'singing_bowl', title, body })
        )
      })
    )
  )
})

// ── Notification Click ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const appClient = clients.find(c => c.url.includes(self.location.origin))
      if (appClient) {
        appClient.focus()
        appClient.postMessage({ type: 'NAVIGATE', url: '/notifications' })
        return
      }
      return self.clients.openWindow('/notifications')
    })
  )
})
