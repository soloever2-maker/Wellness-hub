import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'
import { sendApnsToClient } from '@/lib/apns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webPush.setVapidDetails(
  'mailto:alignwithenjy@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { client_id, title, body, type = 'alert', url } = await request.json()

    // ── 1. Web Push (browser / Android / PWA) — unchanged ──────
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('client_id', client_id)

    let sent = false
    for (const sub of subs || []) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body, icon: '/icon-192x192.png', badge: '/icon-96x96.png', tag: `${type}_${Date.now()}`, data: { type, url: url || '/notifications' } })
        )
        sent = true
      } catch (err: any) {
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    // ── 2. Native APNs (iOS app) — no-op until APNS_* env vars exist ──
    const apnsSent = await sendApnsToClient(supabase, client_id, {
      title,
      body,
      data: { type, url: url || '/notifications' },
    })
    sent = sent || apnsSent

    // Log notification
    await supabase.from('notification_log').insert({
      client_id, type, channel: 'push', message: body,
      status: sent ? 'sent' : 'pending', sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, sent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
