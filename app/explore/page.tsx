'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Award, ChevronRight, Send, Loader2,
  MapPin, Calendar, Users, Sparkles, CheckCircle,
} from 'lucide-react'
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

type Retreat = {
  id: string
  title: string
  description: string
  location: string
  date: string
  end_date: string | null
  price: number | null
  capacity: number | null
  cover_image: string | null
}

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ExplorePage() {
  const router = useRouter()
  const [userId, setUserId]       = useState<string | null>(null)
  const [retreats, setRetreats]   = useState<Retreat[]>([])
  const [activeTab, setActiveTab] = useState<'about' | 'private' | 'retreats'>('about')

  // Private session form
  const [form, setForm] = useState({
    classType: '', preferredDate: '', preferredTime: '', notes: '',
  })
  const [reqStatus, setReqStatus] = useState<RequestStatus>('idle')

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setUserId(u.id) })

    supabase
      .from('retreats')
      .select('id, title, description, location, date, end_date, price, capacity, cover_image')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .then(({ data }) => { if (data) setRetreats(data) })
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
          fill className="object-cover object-top" sizes="100vw" priority
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
          {(['about', 'private', 'retreats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#006D77] border-b-2 border-[#006D77]'
                  : 'text-muted-foreground'
              }`}
            >
              {tab === 'private' ? 'Private Session' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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

        {/* ─── RETREATS TAB ─── */}
        {activeTab === 'retreats' && (
          <>
            {retreats.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No upcoming retreats</p>
                <p className="text-sm text-muted-foreground">Check back soon for new retreat announcements.</p>
              </div>
            ) : (
              retreats.map(r => (
                <Link key={r.id} href={`/retreats/${r.id}`}>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                    {r.cover_image ? (
                      <div className="relative h-44 w-full">
                        <Image src={r.cover_image} alt={r.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-1 bg-[#006D77] text-white text-xs font-semibold rounded-lg">
                            Retreat
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 bg-gradient-to-br from-[#006D77] to-[#004E5C] flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-foreground mb-1">{r.title}</h3>
                      {r.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />{r.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {r.end_date && ` – ${new Date(r.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#006D77]">
                          {r.price ? `EGP ${r.price.toLocaleString()}` : 'Price TBA'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-[#006D77] font-medium">
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
