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

async function sendPushToClient(clientId: string, payload: object) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('client_id', clientId)

  if (!subs || subs.length === 0) return false

  let sent = false
  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
      sent = true
    } catch (err: any) {
      // Subscription expired → clean up
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }
  return sent
}

export async function GET(request: Request) {
  // Two accepted auth methods:
  //  1) Vercel Cron: sends "Authorization: Bearer <CRON_SECRET>" automatically
  //     when the CRON_SECRET env var exists (env vars are NOT interpolated
  //     inside vercel.json, so the query-param approach never worked there)
  //  2) Manual/external trigger: ?secret=<CRON_SECRET> in the URL
  const { searchParams } = new URL(request.url)
  const authHeader = request.headers.get('authorization') || ''
  const bearerOk = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const queryOk = searchParams.get('secret') === process.env.CRON_SECRET
  if (!process.env.CRON_SECRET || (!bearerOk && !queryOk)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const sent: string[] = []
  const errors: string[] = []

  // Get upcoming sessions in next 25 hours
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('id, start_time, class_type:class_types(name)')
    .eq('is_cancelled', false)
    .gte('start_time', now.toISOString())
    .lte('start_time', new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString())

  if (!sessions?.length) {
    return NextResponse.json({ message: 'No upcoming sessions', sent: 0 })
  }

  for (const session of sessions) {
    const startTime = new Date(session.start_time)
    const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const className = (session.class_type as any)?.name || 'Class'
    const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const dateStr = startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    let reminderType: '24h' | '2h' | null = null
    if (hoursUntil >= 23 && hoursUntil <= 25) reminderType = '24h'
    else if (hoursUntil >= 1.5 && hoursUntil <= 2.5) reminderType = '2h'
    if (!reminderType) continue

    // Get confirmed bookings for this session
    const { data: bookings } = await supabase
      .from('bookings')
      .select('client_id, client:users(full_name, preferences)')
      .eq('session_id', session.id)
      .eq('status', 'confirmed')

    if (!bookings) continue

    for (const booking of bookings) {
      const client = booking.client as any
      const prefs = client?.preferences || {}

      // Check preferences
      if (prefs.reminders_whatsapp === false) continue
      if (reminderType === '24h' && prefs.reminders_24h === false) continue
      if (reminderType === '2h' && prefs.reminders_2h === false) continue

      // Prevent duplicate sends
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('client_id', booking.client_id)
        .eq('type', `reminder_${reminderType}`)
        .contains('metadata', { session_id: session.id })
        .limit(1)

      if (existing?.length) continue

      // Build notification payload
      const firstName = (client?.full_name || 'there').split(' ')[0]
      const isUrgent = reminderType === '2h'

      const payload = {
        title: isUrgent ? `⏰ Class in 2 hours!` : `🧘‍♀️ Class Tomorrow`,
        body: isUrgent
          ? `${className} starts at ${timeStr}. Get your mat ready!`
          : `${className} is scheduled for ${dateStr} at ${timeStr}`,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        tag: `reminder_${reminderType}_${session.id}`,
        // Signal app to play singing bowl when opened + open the prepare screen
        data: { type: 'class_reminder', sessionId: session.id, sound: 'singing_bowl', url: '/prepare' },
      }

      const okWeb = await sendPushToClient(booking.client_id, payload)

      // Also deliver to iOS app devices via APNs (no-op until APNS_* env vars exist)
      const okIos = await sendApnsToClient(supabase, booking.client_id, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      })

      const ok = okWeb || okIos

      if (ok) {
        await supabase.from('notification_log').insert({
          client_id: booking.client_id,
          type: `reminder_${reminderType}`,
          channel: 'push',
          message: `${reminderType} reminder: ${className} ${dateStr} ${timeStr}`,
          metadata: { session_id: session.id },
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        sent.push(`${client?.full_name} → ${reminderType} for ${className}`)
      } else {
        errors.push(`No subscription: ${client?.full_name}`)
      }
    }
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    sent: sent.length,
    errors: errors.length,
    details: { sent, errors },
  })
}
