'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Loader2, Sparkles, Heart } from 'lucide-react'

type Partner = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  promo_code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
}

export default function JoinPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [partner, setPartner]   = useState<Partner | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name,   setName]   = useState('')
  const [phone,  setPhone]  = useState('')
  const [email,  setEmail]  = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const fetchPartner = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, logo_url, description, promo_code, discount_type, discount_value')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) setNotFound(true)
      else setPartner(data)
      setLoading(false)
    }
    if (slug) fetchPartner()
  }, [slug])

  const discountLabel =
    partner?.discount_type === 'percentage'
      ? `${partner.discount_value}% off`
      : `${partner?.discount_value} EGP off`

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Please fill in your name and phone number.')
      return
    }
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/partners/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: partner!.id,
        name:       name.trim(),
        phone:      phone.trim(),
        email:      email.trim() || null,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Something went wrong — please try again.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#006D77] animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-4xl">🔍</p>
        <h1 className="text-xl font-bold text-foreground">Link not found</h1>
        <p className="text-sm text-muted-foreground">This partner link is no longer active.</p>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E0EEF0] to-[#FFF8F3] flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#006D77]/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-[#006D77]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">You're on the list! 🎉</h1>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Enjy will reach out to you on WhatsApp soon to set up your account
            and apply your <strong className="text-foreground">{discountLabel}</strong> discount.
          </p>
        </div>

        <div className="bg-white rounded-2xl px-8 py-5 border border-border shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground">Your promo code</p>
          <p className="text-3xl font-bold tracking-widest text-[#006D77]">{partner!.promo_code}</p>
          <p className="text-xs text-muted-foreground">Keep this for when you book</p>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Heart className="w-3 h-3 text-[#E86500]" fill="currentColor" />
          Align with Enjy Wellness Studio
        </p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0EEF0] to-[#FFF8F3]">
      <div className="max-w-md mx-auto px-4 pt-10 pb-16 space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          {/* Partner × Studio */}
          <p className="text-sm text-muted-foreground font-medium">
            {partner!.name} × Align with Enjy
          </p>

          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Welcome! ✨
          </h1>

          {/* Discount badge */}
          <div className="inline-flex items-center gap-2 bg-[#006D77] text-white
                          px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm">
            <Sparkles className="w-4 h-4" />
            Get {discountLabel} on your first package
          </div>

          {partner!.description && (
            <p className="text-sm text-muted-foreground">{partner!.description}</p>
          )}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-sm border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Tell us about yourself</h2>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Full Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Phone Number <span className="text-[#E53935]">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                autoComplete="tel"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Email <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm
                           text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
              />
            </div>

            {/* Promo code display (read-only) */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Your Promo Code
              </label>
              <div className="w-full bg-[#006D77]/5 border border-[#006D77]/20 rounded-xl px-4 py-3
                              flex items-center justify-between">
                <span className="text-sm font-bold text-[#006D77] tracking-wider">
                  {partner!.promo_code}
                </span>
                <span className="text-xs text-[#006D77]/70 font-medium">{discountLabel}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Applied automatically to your first package.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-[#E53935] bg-[#E53935]/5 border border-[#E53935]/20
                            rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !phone.trim()}
            className="w-full py-3.5 bg-[#006D77] text-white font-semibold rounded-xl
                       hover:bg-[#004E5C] active:scale-[0.98] transition-all
                       disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
              : 'Join Now →'
            }
          </button>

          <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
            Your details will only be used to set up your Align with Enjy account.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-[#E86500]" fill="currentColor" />
          Align with Enjy · Wellness Studio
        </p>
      </div>
    </div>
  )
}
