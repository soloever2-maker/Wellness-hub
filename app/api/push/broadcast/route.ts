import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'
import { sendApnsBroadcast } from '@/lib/apns'

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
    const { clientIds, title, body } = await request.json()

    if (!clientIds?.length || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const finalTitle = title || '📢 Message from Enjy'

    // ── 1. Web Push subscriptions (browser / Android) ──────────
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('client_id, endpoint, p256dh, auth')
      .in('client_id', clientIds)

    let sent = 0
    const errors: string[] = []

    for (const sub of subs || []) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: finalTitle,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            tag: `broadcast_${Date.now()}`,
            data: { type: 'broadcast' },
          })
        )
        sent++
      } catch (err: any) {
        // Clean up expired subscriptions
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        errors.push(err.message)
      }
    }

    // ── 2. Native APNs (iOS app) — no-op until APNS_* env vars exist ──
    const apns = await sendApnsBroadcast(supabase, clientIds, {
      title: finalTitle,
      body,
      data: { type: 'broadcast', url: '/notifications' },
    })
    sent += apns.sent
    errors.push(...apns.errors)

    // Log the announcement for EVERY selected client — this is what the
    // in-app Notifications page reads. Clients without push enabled still
    // see the message there.
    const nowIso = new Date().toISOString()
    const { error: logError } = await supabase.from('notification_log').insert(
      clientIds.map((cid: string) => ({
        client_id: cid,
        type: 'broadcast',
        channel: 'push',
        message: title ? `${finalTitle} — ${body}` : body,
        status: 'sent',
        sent_at: nowIso,
      }))
    )
    if (logError) errors.push(`log:${logError.message}`)

    const total = (subs?.length || 0) + apns.total

    return NextResponse.json({ sent, total, errors })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
