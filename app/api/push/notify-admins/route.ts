import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webPush from 'web-push'
import { sendApnsToClient } from '@/lib/apns'

// ── Notify admins (push) when a client submits a review,
//    suggestion, or feedback ─────────────────────────────────────
// Caller must be a logged-in user; the sender's name is derived
// from their token (can't be spoofed from the client).

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
    // 1) Identify the sender from their access token
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })

    const { data: callerAuth, error: callerError } = await supabase.auth.getUser(token)
    if (callerError || !callerAuth.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { data: sender } = await supabase
      .from('users')
      .select('full_name')
      .eq('auth_id', callerAuth.user.id)
      .single()

    const firstName = sender?.full_name?.split(' ')[0] || 'A client'

    // 2) Build the message
    const { kind, rating, class_type } = await request.json()
    let title = '💬 New feedback'
    let body = `${firstName} shared feedback with you`
    let url = '/admin/feedback'
    if (kind === 'review') {
      title = '⭐ New review'
      body = `${firstName} left ${rating || '?'}★ on ${class_type || 'a class'} — tap to approve`
    } else if (kind === 'suggestion') {
      title = '💡 New suggestion'
      body = `${firstName} sent you an idea`
    } else if (kind === 'signup') {
      title = '🔔 New access request'
      body = `${firstName} requested to join — tap to review`
      url = '/admin/approvals'
    }

    // 3) Find all approved admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'approved')

    if (!admins?.length) return NextResponse.json({ ok: true, sent: 0 })

    let sent = 0
    for (const admin of admins) {
      // Web Push
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('client_id', admin.id)

      for (const sub of subs || []) {
        try {
          await webPush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title, body,
              icon: '/icon-192x192.png', badge: '/icon-96x96.png',
              tag: `feedback_${Date.now()}`,
              data: { type: 'admin_feedback', url },
            })
          )
          sent++
        } catch (err: any) {
          if (err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      }

      // Native iOS (no-op until APNS_* env vars exist)
      const ok = await sendApnsToClient(supabase, admin.id, {
        title, body,
        data: { type: 'admin_feedback', url },
      })
      if (ok) sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
