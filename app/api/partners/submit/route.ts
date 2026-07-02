import { NextResponse } from 'next/server'
import { createClient }  from '@supabase/supabase-js'
import webPush           from 'web-push'

// ── Service-role client (bypasses RLS) ───────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webPush.setVapidDetails(
  'mailto:alignwithenjy@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// ── Helpers ──────────────────────────────────────────────────────
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('20') && digits.length >= 12) return `+${digits}`
  if (digits.startsWith('0')  && digits.length === 11) return `+20${digits.slice(1)}`
  if (digits.length === 10) return `+20${digits}`
  return `+20${digits}`
}

// ── POST /api/partners/submit ─────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { partner_id, name, phone, email } = await request.json()

    if (!partner_id || !name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone.trim())

    // 1. Verify partner exists and is active
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, promo_code')
      .eq('id', partner_id)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found or inactive.' }, { status: 404 })
    }

    // 2. Idempotency — same phone + same partner = no duplicate lead
    const { data: existingLead } = await supabase
      .from('partner_leads')
      .select('id')
      .eq('partner_id', partner_id)
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existingLead) {
      // Already registered — return success silently (don't confuse the user)
      return NextResponse.json({ ok: true })
    }

    // 3. Create or find the users row (pending, no auth_id yet)
    let clientId: string | null = null

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existingUser) {
      clientId = existingUser.id
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          full_name: name.trim(),
          phone:     normalizedPhone,
          email:     email?.trim() || null,
          role:      'client',
          status:    'pending',
        })
        .select('id')
        .single()

      if (userError) {
        console.error('User insert error:', userError)
        // Non-fatal — continue without client_id
      } else {
        clientId = newUser?.id ?? null
      }
    }

    // 4. Insert the lead
    const { error: leadError } = await supabase.from('partner_leads').insert({
      partner_id,
      name:      name.trim(),
      phone:     normalizedPhone,
      email:     email?.trim() || null,
      status:    'new',
      client_id: clientId,
    })

    if (leadError) {
      console.error('Lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to save your details. Please try again.' }, { status: 500 })
    }

    // 5. Send push notification to all admins
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      if (admins?.length) {
        const adminIds = admins.map(a => a.id)

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .in('client_id', adminIds)

        const payload = JSON.stringify({
          title: `🤝 New Lead from ${partner.name}`,
          body:  `${name.trim()} · ${normalizedPhone}`,
          icon:  '/icon-192x192.png',
          badge: '/icon-96x96.png',
          tag:   `partner_lead_${Date.now()}`,
          data:  { type: 'partner_lead', url: '/admin/partners' },
        })

        for (const sub of subs ?? []) {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          } catch (pushErr: any) {
            if (pushErr?.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          }
        }
      }
    } catch (notifErr) {
      // Notification failure is non-fatal
      console.warn('Push notification failed:', notifErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Partner submit error:', err)
    return NextResponse.json({ error: err.message ?? 'Server error.' }, { status: 500 })
  }
}
