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
    const { session_id } = await request.json()

    // First person on waitlist
    const { data: waitlisted } = await supabase
      .from('waitlist')
      .select('id, client_id')
      .eq('session_id', session_id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!waitlisted) return NextResponse.json({ promoted: false })

    // Get their active package
    const { data: pkg } = await supabase
      .from('client_packages')
      .select('id, sessions_remaining')
      .eq('client_id', waitlisted.client_id)
      .eq('status', 'active')
      .gt('sessions_remaining', 0)
      .order('expiry_date')
      .limit(1)
      .maybeSingle()

    // Create confirmed booking
    const { error } = await supabase.from('bookings').insert({
      session_id,
      client_id: waitlisted.client_id,
      client_package_id: pkg?.id || null,
      status: 'confirmed',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Decrement sessions_remaining
    if (pkg) {
      await supabase.from('client_packages')
        .update({ sessions_remaining: pkg.sessions_remaining - 1 })
        .eq('id', pkg.id)
    }

    // Mark as promoted in waitlist
    await supabase.from('waitlist').update({ status: 'promoted' }).eq('id', waitlisted.id)

    // Get session info for notification
    const { data: session } = await supabase
      .from('class_sessions')
      .select('start_time, class_type:class_types(name)')
      .eq('id', session_id)
      .single()

    if (session) {
      const className = (session.class_type as any)?.name || 'Class'
      const time = new Date(session.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      const date = new Date(session.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const title = "🎉 You're in!"
      const body = `Your spot in ${className} on ${date} at ${time} is confirmed!`

      // ── Web Push subscriptions ────────────────────────────────
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('client_id', waitlisted.client_id)

      let sent = false
      for (const sub of subs || []) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title,
              body,
              icon: '/icon-192x192.png',
              badge: '/icon-96x96.png',
              tag: `waitlist_promoted_${session_id}`,
              data: { type: 'waitlist_promoted', url: '/schedule' },
            })
          )
          sent = true
        } catch (err: any) {
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      }

      // ── Native iOS (APNs) ─────────────────────────────────────
      const okIos = await sendApnsToClient(supabase, waitlisted.client_id, {
        title,
        body,
        data: { type: 'waitlist_promoted', url: '/schedule' },
      })
      if (okIos) sent = true

      // Log — status reflects whether push actually landed
      await supabase.from('notification_log').insert({
        client_id: waitlisted.client_id,
        type: 'waitlist_promoted',
        channel: 'push',
        message: body,
        status: sent ? 'sent' : 'pending',
        sent_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ promoted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
