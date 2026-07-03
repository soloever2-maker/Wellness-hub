'use client'

// ── Explore ────────────────────────────────────────────────────
// About Enjy + Private Session request.
// Reviews moved to their own pages: /reviews (Clients Reviews)
// and /reviews/write (Review Your Class).

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Award, Send, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

const CERTS = [
  'RYT-500 Yoga Alliance',
  'YACEP — Continuing Education',
  '860 hrs Diploma — Yoga Therapy',
  '100 hrs — Yin Yoga Certified',
  '100 hrs — Vinyasa',
  'Group Fitness — IFPA',
  'Sports Nutrition — IFPA',
  'Pranic Healing',
  'Thai Massage',
  '4 × 200 hrs Teacher Training',
]

const CLASS_TYPES = [
  'Power Yoga', 'Mat Pilates', 'Gentle Yoga & Recovery',
  'Belly Rhythmic Dancing', 'Aqua Aerobics', 'Sound Healing',
  'Meditation', 'Breathwork',
]

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ExplorePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'private'>('about')

  // Private session form
  const [form, setForm] = useState({
    classType: '', preferredDate: '', preferredTime: '', notes: '',
  })
  const [reqStatus, setReqStatus] = useState<RequestStatus>('idle')

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setUserId(u.id) })

    // Deep link: /explore?tab=private
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'private') setActiveTab('private')
    } catch { /* ignore */ }
  }, [])

  const handleRequest = async () => {
    if (!userId) { router.push('/login'); return }
    if (!form.classType || !form.preferredDate) return
    setReqStatus('loading')
    const { error } = await supabase.from('private_session_requests').insert({
      client_id: userId,
      class_type: form.classType,
      preferred_date: form.preferredDate,
      preferred_time: form.preferredTime || null,
      notes: form.notes || null,
    })
    setReqStatus(error ? 'error' : 'success')
    if (!error) setForm({ classType: '', preferredDate: '', preferredTime: '', notes: '' })
  }

  return (
    <main className="bg-background min-h-screen pb-28">

      {/* TopBar */}
      <TopBar />

      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden">
        <Image
          src="/images/trainer/enjy-hero.jpg"
          alt="Enjy Gebril"
          fill className="object-cover object-[center_35%]" sizes="100vw" priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-4">
          <p className="text-xs text-white/70 font-medium uppercase tracking-widest mb-1">Align with Enjy</p>
          <h1 className="text-2xl font-bold text-white">Enjy Abdel Monem</h1>
          <p className="text-white/80 text-sm mt-0.5">Yoga Therapist & RYT-500 Teacher</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex">
          {(['about', 'private'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#006D77] border-b-2 border-[#006D77]'
                  : 'text-muted-foreground'
              }`}
            >
              {tab === 'private' ? 'Private Session' : 'About'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* ─── ABOUT TAB ─── */}
        {activeTab === 'about' && (
          <>
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-foreground">About Enjy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A yoga therapist and 500 RYT multi-style yoga teacher who is passionate about teaching
                different techniques to get the best out of every yoga class — learning breathing
                techniques and restoring best body alignment that creates not only a flexible body
                but also expands the mind.
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-[#006D77]" />
                <h2 className="font-bold text-foreground">Certifications</h2>
              </div>
              <div className="space-y-2.5">
                {CERTS.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006D77] mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#006D77]/5 border border-[#006D77]/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#006D77]" />
                <h2 className="font-bold text-foreground">What I Offer</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {CLASS_TYPES.map(c => (
                  <span key={c} className="px-3 py-1.5 bg-white border border-[#006D77]/20 rounded-full text-xs font-medium text-[#006D77]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── PRIVATE SESSION TAB ─── */}
        {activeTab === 'private' && (
          <>
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-foreground mb-1">Book a Private Session</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Tell Enjy what you need and she'll reach out to schedule your session.
              </p>

              {reqStatus === 'success' ? (
                <div className="flex flex-col items-center py-6 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#006D77]/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-[#006D77]" />
                  </div>
                  <p className="font-semibold text-foreground">Request Sent!</p>
                  <p className="text-sm text-muted-foreground">Enjy will contact you soon to confirm your session.</p>
                  <button
                    onClick={() => setReqStatus('idle')}
                    className="mt-2 text-sm text-[#006D77] font-medium"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Class type */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Class Type *
                    </label>
                    <select
                      value={form.classType}
                      onChange={e => setForm(f => ({ ...f, classType: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                    >
                      <option value="">Select a class type...</option>
                      {CLASS_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Preferred date */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      value={form.preferredDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                    />
                  </div>

                  {/* Preferred time */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Preferred Time
                    </label>
                    <select
                      value={form.preferredTime}
                      onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                    >
                      <option value="">Any time</option>
                      <option value="Morning (7–10 AM)">Morning (7–10 AM)</option>
                      <option value="Midday (10 AM–1 PM)">Midday (10 AM–1 PM)</option>
                      <option value="Afternoon (1–5 PM)">Afternoon (1–5 PM)</option>
                      <option value="Evening (5–9 PM)">Evening (5–9 PM)</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Notes (optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any specific goals, injuries, or preferences..."
                      rows={3}
                      className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 resize-none"
                    />
                  </div>

                  {reqStatus === 'error' && (
                    <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
                  )}

                  <button
                    onClick={handleRequest}
                    disabled={reqStatus === 'loading' || !form.classType || !form.preferredDate}
                    className="w-full py-3.5 bg-[#006D77] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {reqStatus === 'loading'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                    Send Request
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
