'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Award, Send, Loader2, Star, X,
  Sparkles, CheckCircle,
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

type Review = {
  id: string
  rating: number | null
  class_type: string | null
  comment: string
  created_at: string
  client: { full_name: string } | null
}

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

export default function ExplorePage() {
  const router = useRouter()
  const [userId, setUserId]       = useState<string | null>(null)
  const [reviews, setReviews]     = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState<'about' | 'private' | 'reviews'>('about')

  // Review form (bottom sheet)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ type: 'review', rating: 5, classType: '', comment: '' })
  const [reviewStatus, setReviewStatus] = useState<RequestStatus>('idle')

  // Private session form
  const [form, setForm] = useState({
    classType: '', preferredDate: '', preferredTime: '', notes: '',
  })
  const [reqStatus, setReqStatus] = useState<RequestStatus>('idle')

  useEffect(() => {
    getCurrentUser().then(u => { if (u) setUserId(u.id) })

    supabase
      .from('reviews')
      .select('id, rating, class_type, comment, created_at, client:users(full_name)')
      .eq('type', 'review')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setReviews(data as unknown as Review[]) })
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

  const handleSubmitReview = async () => {
    if (!userId) { router.push('/login'); return }
    if (!reviewForm.comment.trim()) return
    if (reviewForm.type === 'review' && !reviewForm.classType) return
    setReviewStatus('loading')
    const { error } = await supabase.from('reviews').insert({
      client_id: userId,
      type: reviewForm.type,
      rating: reviewForm.type === 'review' ? reviewForm.rating : null,
      class_type: reviewForm.type === 'review' ? reviewForm.classType : null,
      comment: reviewForm.comment.trim(),
      is_approved: false,
    })
    setReviewStatus(error ? 'error' : 'success')
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
          {(['about', 'private', 'reviews'] as const).map(tab => (
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

        {/* ─── REVIEWS TAB ─── */}
        {activeTab === 'reviews' && (
          <>
            {/* Summary + CTA */}
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold text-foreground">
                          {(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                        </span>
                        <Star className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">Be the first to review ⭐</p>
                  )}
                </div>
                <button
                  onClick={() => { setReviewStatus('idle'); setReviewForm({ type: 'review', rating: 5, classType: '', comment: '' }); setShowReviewModal(true) }}
                  className="px-4 py-2.5 rounded-full bg-[#006D77] text-white text-xs font-semibold active:scale-[0.97] transition-all"
                >
                  Share Your Experience
                </button>
              </div>
            </div>

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground px-8">
                  Took a class with Enjy? Tell the community how it went!
                </p>
              </div>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E0EEF0] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#006D77]">
                          {(r.client?.full_name || 'A').slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {r.client?.full_name?.split(' ')[0] || 'A member'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.rating || 0) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-border'}`} />
                      ))}
                    </div>
                  </div>
                  {r.class_type && (
                    <span className="inline-block text-[10px] font-semibold text-[#006D77] bg-[#E0EEF0] px-2 py-0.5 rounded-full mb-2">
                      {r.class_type}
                    </span>
                  )}
                  <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ─── Review / Feedback bottom-sheet ─── */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/40 z-[150] flex items-end" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white w-full rounded-t-3xl px-6 pt-6 pb-10 space-y-4 shadow-xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Share Your Experience</h3>
              <button onClick={() => setShowReviewModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewStatus === 'success' ? (
              <div className="flex flex-col items-center py-8 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <p className="font-bold text-foreground">Thank you! 🤍</p>
                <p className="text-sm text-muted-foreground px-4">
                  {reviewForm.type === 'review'
                    ? 'Your review was sent and will appear here once approved.'
                    : 'Your message was sent to Enjy directly.'}
                </p>
                <button onClick={() => setShowReviewModal(false)}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#006D77] text-white text-sm font-semibold">
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'review', label: '⭐ Review a Class' },
                    { id: 'suggestion', label: '💡 Suggestion' },
                    { id: 'feedback', label: '💬 Feedback' },
                  ] as const).map(t => (
                    <button key={t.id}
                      onClick={() => setReviewForm(f => ({ ...f, type: t.id }))}
                      className={`py-2.5 px-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                        reviewForm.type === t.id
                          ? 'bg-[#006D77] text-white border-[#006D77]'
                          : 'bg-white text-foreground border-border'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {reviewForm.type === 'review' ? (
                  <>
                    {/* Stars */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                            <Star className={`w-8 h-8 transition-colors ${n <= reviewForm.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-border'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Class type */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Which class?</label>
                      <select
                        value={reviewForm.classType}
                        onChange={e => setReviewForm(f => ({ ...f, classType: e.target.value }))}
                        className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30"
                      >
                        <option value="">Select a class...</option>
                        {CLASS_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground bg-[#E0EEF0]/50 rounded-xl px-3 py-2.5">
                    {reviewForm.type === 'suggestion'
                      ? '💡 Ideas for classes, schedules, or packages — goes to Enjy privately.'
                      : '💬 Anything on your mind — goes to Enjy privately, not published.'}
                  </p>
                )}

                {/* Comment */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    {reviewForm.type === 'review' ? 'Your review' : 'Your message'}
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder={reviewForm.type === 'review' ? 'How was your experience?' : 'Tell Enjy what you think...'}
                    rows={4}
                    className="w-full border border-border rounded-xl px-3 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 resize-none"
                  />
                </div>

                {reviewStatus === 'error' && (
                  <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewStatus === 'loading' || !reviewForm.comment.trim() || (reviewForm.type === 'review' && !reviewForm.classType)}
                  className="w-full py-3.5 bg-[#006D77] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {reviewStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
