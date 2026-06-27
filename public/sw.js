const CACHE_NAME = 'align-enjy-v3'
const STATIC_ASSETS = ['/manifest.json', '/icon.png', '/icon-192x192.png', '/icon-512x512.png']

// ── Skip waiting when told to (for update banner) ──────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ── Install ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate — clear old caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch — network first for pages ────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('supabase.co')) return
  if (event.request.url.includes('/api/')) return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate' ||
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone))
          return res
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('/')))
    )
    return
  }

  if (STATIC_ASSETS.some(a => url.pathname === a) ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(res => {
          if (res?.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()))
          }
          return res
        })
      })
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res?.status === 200 && res.type === 'basic') {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// ── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, badge, tag, data: extraData } = data

  const options = {
    body,
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-96x96.png',
    tag: tag || 'align-notification',
    renotify: true,
    requireInteraction: false,
    data: extraData || {},
    actions: [
      { action: 'open', title: 'View Schedule' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // If app is open → tell it to play sound + show in-app banner
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'PUSH_RECEIVED',
              sound: 'singing_bowl',
              title,
              body,
            })
          })
        })
    })
  )
})

// ── Notification click ─────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // If app already open → focus it
        const appClient = clients.find(c => c.url.includes(self.location.origin))
        if (appClient) {
          appClient.focus()
          appClient.postMessage({ type: 'NAVIGATE', url: '/notifications' })
          return
        }
        // Open new window
        return self.clients.openWindow('/notifications')
      })
  )
})
