// ── Client-side push subscription management ──────────────────
// Two modes, same public API (profile/page.tsx needs NO changes):
//   • Browser / Android / PWA  → Web Push (VAPID) — unchanged behavior
//   • Inside the iOS Capacitor shell → native APNs via the
//     PushNotifications plugin injected by Capacitor into the page.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const NATIVE_TOKEN_KEY = 'apns_device_token'

// ── Native (Capacitor) detection ───────────────────────────────
// The iOS shell loads this site via `server.url`, and Capacitor
// injects `window.Capacitor` into the remote page automatically.
function getNativePush(): any | null {
  if (typeof window === 'undefined') return null
  const cap = (window as any).Capacitor
  if (cap?.isNativePlatform?.() && cap?.Plugins?.PushNotifications) {
    return cap.Plugins.PushNotifications
  }
  return null
}

export function isNativeApp(): boolean {
  return !!getNativePush()
}

// Deep-link when the user taps a notification (native only).
let tapListenerAdded = false
function ensureTapListener() {
  const Push = getNativePush()
  if (!Push || tapListenerAdded) return
  tapListenerAdded = true
  Push.addListener('pushNotificationActionPerformed', (event: any) => {
    const url = event?.notification?.data?.url
    if (typeof url === 'string' && url.startsWith('/')) {
      window.location.href = url
    }
  })
}
if (typeof window !== 'undefined') {
  // Runs once when this module is first imported in the browser.
  setTimeout(ensureTapListener, 0)
}

// ── Helpers (Web Push) ─────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

// ── Public API ─────────────────────────────────────────────────

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (isNativeApp()) return true // iOS shell always supports APNs
  return 'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
}

export async function isPushEnabled(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const Push = getNativePush()
  if (Push) {
    try {
      const perm = await Push.checkPermissions()
      return perm?.receive === 'granted' && !!localStorage.getItem(NATIVE_TOKEN_KEY)
    } catch {
      return false
    }
  }

  if (!await isPushSupported()) return false
  if (Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

export async function subscribeToPush(clientId: string): Promise<{ ok: boolean; error?: string }> {
  const Push = getNativePush()
  if (Push) return subscribeNative(Push, clientId)
  return subscribeWeb(clientId)
}

export async function unsubscribeFromPush(): Promise<void> {
  const Push = getNativePush()
  if (Push) {
    try {
      const token = localStorage.getItem(NATIVE_TOKEN_KEY)
      if (token) {
        await fetch('/api/push/register-device', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        localStorage.removeItem(NATIVE_TOKEN_KEY)
      }
      await Push.unregister()
    } catch { /* silent */ }
    return
  }

  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
  } catch { /* silent */ }
}

// ── Native subscribe flow (iOS shell) ──────────────────────────
async function subscribeNative(Push: any, clientId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    ensureTapListener()

    // 1. Ask permission (shows the native iOS dialog the first time)
    const perm = await Push.requestPermissions()
    if (perm?.receive !== 'granted') {
      return {
        ok: false,
        error: 'Please allow notifications: Settings → Align with Enjy → Notifications.',
      }
    }

    // 2. Register with APNs and wait for the device token
    const token = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Registration timed out. Please try again.')), 15000)
      const regHandle = Push.addListener('registration', (t: { value: string }) => {
        clearTimeout(timer)
        resolve(t.value)
      })
      const errHandle = Push.addListener('registrationError', (e: any) => {
        clearTimeout(timer)
        reject(new Error(e?.error || 'APNs registration failed'))
      })
      // Fire registration (listeners are already attached)
      Push.register().catch((e: any) => {
        clearTimeout(timer)
        reject(e)
      })
      // Note: listener handles are cleaned up automatically when the
      // WebView reloads; duplicate resolves are harmless (Promise ignores them).
      void regHandle; void errHandle
    })

    // 3. Save token to server
    const res = await fetch('/api/push/register-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, client_id: clientId, platform: 'ios' }),
    })
    if (!res.ok) throw new Error('Failed to save device token')

    localStorage.setItem(NATIVE_TOKEN_KEY, token)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Subscription failed' }
  }
}

// ── Web Push subscribe flow (browser / Android — unchanged) ────
async function subscribeWeb(clientId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { ok: false, error: 'Please allow notifications in your browser settings.' }
    }

    const reg = await navigator.serviceWorker.ready

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth, client_id: clientId }),
    })

    if (!res.ok) throw new Error('Failed to save subscription')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Subscription failed' }
  }
}
