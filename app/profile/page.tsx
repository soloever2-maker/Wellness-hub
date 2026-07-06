'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Phone, MapPin, Camera, Info, LogOut, MessageCircle, X, Check, Fingerprint, Lock, Bell, Sparkles, Trash2, ShieldCheck, CalendarDays, Hash } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { Logo } from '@/components/logo'
import { useRouter, useSearchParams } from 'next/navigation'
import { logoutUser, getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { isPushSupported, isPushEnabled, subscribeToPush, unsubscribeFromPush } from '@/lib/push-client'
import { playTing, playSingingBowl } from '@/lib/sounds'
import {
  isBiometricSupported,
  isBiometricEnabled,
  registerBiometric,
  disableBiometric,
  getSavedEmail,
} from '@/lib/biometric'
import { ChangePasswordRow } from '@/components/change-password-row'

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reminders, setReminders] = useState({ whatsapp: true, hour24: true, hour2: true })
  const [isEditing, setIsEditing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricPassword, setBiometricPassword] = useState('')
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricError, setBiometricError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [profile, setProfile]           = useState({ name: '', phone: '', email: '', userId: '', clientId: 0, dateOfBirth: '' })
  const [avatarUrl, setAvatarUrl]         = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editForm, setEditForm] = useState(profile)
  // Push notifications state
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState('')
  // Welcome onboarding
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeStep, setWelcomeStep] = useState<'intro' | 'notifications' | 'biometric'>('intro')

  useEffect(() => {
    setBiometricSupported(isBiometricSupported())
    setBiometricEnabled(isBiometricEnabled())

    // Check push notification support + status
    isPushSupported().then(supported => {
      setPushSupported(supported)
      if (supported) isPushEnabled().then(setPushEnabled)
    })

    // Show welcome modal on first login
    if (searchParams.get('welcome') === 'true') {
      setTimeout(() => setShowWelcome(true), 600)
    }

    const fetchUser = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.replace('/login')
          return
        }
        const userData = {
          name: user.full_name || '',
          phone: user.phone || '',
          email: user.email || '',
          userId: user.id || '',
          clientId: (user as any).client_id || 0,
          dateOfBirth: (user as any).date_of_birth || '',
        }
        setProfile(userData)
        setEditForm(userData)
        if ((user as any).avatar_url) setAvatarUrl((user as any).avatar_url)

        // Load saved reminder preferences
        if (user.preferences) {
          setReminders({
            whatsapp: user.preferences.reminders_whatsapp ?? true,
            hour24: user.preferences.reminders_24h ?? true,
            hour2: user.preferences.reminders_2h ?? true,
          })
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSave = async () => {
    setSaveLoading(true)
    setSaveError('')

    // Validate full name — must have at least first + last name
    const nameParts = editForm.name.trim().split(/\s+/)
    if (nameParts.length < 2 || nameParts.some(p => p.length === 0)) {
      setSaveError('Please enter your first and last name.')
      setSaveLoading(false)
      return
    }

    try {
      const updatePayload: Record<string, unknown> = {
        full_name: editForm.name,
        email: editForm.email,
      }
      if (editForm.dateOfBirth) updatePayload.date_of_birth = editForm.dateOfBirth

      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', profile.userId)

      if (error) throw new Error(error.message)

      setProfile({ ...editForm })
      setIsEditing(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      router.replace('/login')
    }
  }

  // ── Delete Account (App Store Guideline 5.1.1(v)) ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Session expired. Please sign in again.')

      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete account')

      // Local sign-out (auth user is already gone on the server)
      try { await supabase.auth.signOut() } catch { /* already deleted */ }
      if (typeof window !== 'undefined') localStorage.clear()
      router.replace('/login')
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  // Resize image → base64 (max 200×200, JPEG 80%)
  const resizeToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 200
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = url
    })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile.userId) return
    setAvatarUploading(true)
    try {
      const base64 = await resizeToBase64(file)
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: base64 })
        .eq('id', profile.userId)
      if (!error) setAvatarUrl(base64)
      else console.error('Avatar save error:', error)
    } catch (err) {
      console.error('Avatar upload error:', err)
    }
    setAvatarUploading(false)
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('')
    : '?'

  if (loading) {
    return (
      <main className="bg-background min-h-screen pb-24">
        <div className="px-4 pt-8 pb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-secondary animate-pulse mb-4" />
          <div className="h-5 w-36 bg-secondary rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-28 bg-secondary rounded-lg animate-pulse" />
        </div>
        <div className="px-4 space-y-4">
          <div className="h-32 bg-secondary rounded-2xl animate-pulse" />
          <div className="h-32 bg-secondary rounded-2xl animate-pulse" />
        </div>
        <BottomNav activePage="profile" />
      </main>
    )
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-6 flex flex-col items-center">
        {/* Tappable Avatar */}
        <label className="relative w-20 h-20 cursor-pointer mb-4 block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={avatarUploading}
          />
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#006D77]/20 shadow">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #006D77, #B8612A)' }}>
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
            )}
          </div>
          {/* Camera overlay */}
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#006D77] border-2 border-white flex items-center justify-center shadow">
            {avatarUploading
              ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-white" />}
          </div>
        </label>
        <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
        {profile.clientId > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-[#006D77]/10 text-[#006D77] px-3 py-1 rounded-full">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-wide">ID: {profile.clientId}</span>
          </div>
        )}
        <button
          onClick={() => { setEditForm(profile); setIsEditing(true); setSaveError('') }}
          className="mt-3 text-sm font-medium text-[#006D77] block"
        >
          Edit Profile
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Full Name <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="First & Last name (e.g. Sara Ahmed)"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
                <p className="text-[10px] text-muted-foreground mt-1">First and last name required</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Date of Birth <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  disabled
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Phone number cannot be changed</p>
              </div>
              {saveError && (
                <p className="text-xs text-red-500 text-center">{saveError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saveLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Check className="w-5 h-5" /> Save Changes</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">About</h3>
              <button onClick={() => setShowAbout(false)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <Logo size="md" />
            </div>
            <div className="space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                Align with Enjy is a ladies-only wellness studio in 6th of October City, Giza, Egypt. Founded and led by trainer Enjy Gebril, we offer yoga, pilates, fitness, and dance classes in a supportive and empowering environment.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                With a 5.0-star Google rating, we are committed to helping every woman find her balance through movement and mindfulness.
              </p>
              <div className="bg-background rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground">📍 First 6th of October, Giza, Egypt</p>
                <p className="text-xs text-muted-foreground">📞 +20 10 63751653</p>
                <p className="text-xs text-muted-foreground">⭐ 5.0 — Google Verified</p>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">Version 1.0 — June 2026</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-4">
        {/* Complete Profile Banner — shown when DOB or full name is missing */}
        {(!profile.dateOfBirth || profile.name.trim().split(/\s+/).length < 2) && (
          <button
            onClick={() => { setEditForm(profile); setIsEditing(true); setSaveError('') }}
            className="w-full bg-gradient-to-r from-[#B8612A]/10 to-[#006D77]/10 border border-[#B8612A]/30 rounded-2xl p-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#B8612A]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#B8612A]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Complete Your Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!profile.dateOfBirth && profile.name.trim().split(/\s+/).length < 2
                  ? 'Add your full name and date of birth'
                  : !profile.dateOfBirth
                  ? 'Add your date of birth'
                  : 'Add your full name (first + last)'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        )}

        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'Client ID', value: profile.clientId > 0 ? `#${profile.clientId}` : '—' },
              { label: 'Full Name', value: profile.name },
              { label: 'Phone', value: profile.phone, badge: 'Verified' },
              { label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
            ].map((item, i, arr) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-sm text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full">{item.badge}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {pushSupported && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Notifications</p>
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">

              {/* Master Push Toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#006D77]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Class reminders on your phone</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setPushLoading(true)
                    setPushError('')
                    if (pushEnabled) {
                      await unsubscribeFromPush()
                      setPushEnabled(false)
                    } else {
                      const result = await subscribeToPush(profile.userId)
                      if (result.ok) {
                        setPushEnabled(true)
                        playTing()
                      } else {
                        setPushError(result.error || 'Failed')
                      }
                    }
                    setPushLoading(false)
                  }}
                  disabled={pushLoading}
                  className={`w-11 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-[#006D77]' : 'bg-gray-200'} disabled:opacity-60`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${pushEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {pushError && (
                <div className="px-4 py-2 bg-red-50">
                  <p className="text-xs text-red-500">{pushError}</p>
                </div>
              )}

              {/* Reminder timing sub-toggles (only when push is enabled) */}
              {pushEnabled && (
                <>
                  {[
                    { label: '24-hour reminder', desc: 'Day before class', key: 'hour24' as const, prefKey: 'reminders_24h' },
                    { label: '2-hour reminder', desc: 'Before class starts', key: 'hour2' as const, prefKey: 'reminders_2h' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center justify-between pl-12 pr-4 py-3 ${i < 1 ? 'border-b border-border' : ''}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={async () => {
                          const newVal = !reminders[item.key]
                          setReminders(prev => ({ ...prev, [item.key]: newVal }))
                          if (profile.userId) {
                            const { data: current } = await supabase.from('users').select('preferences').eq('id', profile.userId).single()
                            const prefs = (current?.preferences as Record<string, boolean>) || {}
                            prefs[item.prefKey] = newVal
                            await supabase.from('users').update({ preferences: prefs }).eq('id', profile.userId)
                          }
                        }}
                        className={`w-10 h-5 rounded-full transition-colors relative ${reminders[item.key] ? 'bg-[#006D77]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${reminders[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {!pushEnabled && (
              <p className="text-xs text-muted-foreground px-1 mt-1">
                Enable to get reminders 24h and 2h before your class 🧘‍♀️
              </p>
            )}
          </div>
        )}

        {/* Security */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Security</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
            <ChangePasswordRow />
            {biometricSupported && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-[#006D77]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Biometric Login</p>
                    <p className="text-xs text-muted-foreground">Fingerprint / Face ID</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (biometricEnabled) {
                      disableBiometric()
                      setBiometricEnabled(false)
                    } else {
                      setBiometricError('')
                      setBiometricPassword('')
                      setShowBiometricSetup(true)
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${biometricEnabled ? 'bg-[#006D77]' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${biometricEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Biometric Setup Modal */}
        {showBiometricSetup && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Enable Biometrics</h3>
                <button onClick={() => setShowBiometricSetup(false)} className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-[#006D77]" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Enter your password to confirm, then follow the biometric prompt on your device
              </p>
              {biometricError && (
                <p className="text-xs text-red-500 text-center mb-3">{biometricError}</p>
              )}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={biometricPassword}
                    onChange={(e) => setBiometricPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                  />
                </div>
              </div>
              <button
                disabled={!biometricPassword || biometricLoading}
                onClick={async () => {
                  if (!biometricPassword) return
                  setBiometricLoading(true)
                  setBiometricError('')
                  try {
                    // Use the REAL auth email from the current session —
                    // the users-table email can drift out of sync with it,
                    // which made correct passwords fail as "wrong".
                    const { data: { session } } = await supabase.auth.getSession()
                    const authEmail = session?.user?.email
                    if (!authEmail) {
                      setBiometricError('Session expired. Please log out and log in again.')
                      return
                    }
                    // Verify password first
                    const { error: verifyError } = await supabase.auth.signInWithPassword({
                      email: authEmail,
                      password: biometricPassword,
                    })
                    if (verifyError) {
                      setBiometricError('Wrong password. Please try again.')
                      return
                    }
                    // Then register biometric — store password behind biometric gate
                    const success = await registerBiometric(authEmail, biometricPassword)
                    if (success) {
                      setBiometricEnabled(true)
                      setShowBiometricSetup(false)
                      setBiometricPassword('')
                    } else {
                      setBiometricError('Biometric setup failed. Make sure your device supports it.')
                    }
                  } catch {
                    setBiometricError('Something went wrong. Please try again.')
                  } finally {
                    setBiometricLoading(false)
                  }
                }}
                className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {biometricLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Fingerprint className="w-5 h-5" /> Enable Biometrics</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Support */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Support</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <a href="https://soloever2-maker.github.io/Enjy-FlowWA/" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors">
              <Camera className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Enjy&apos;s Website</span>
              <span className="text-xs text-muted-foreground mr-2">alignwithenjy.app</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://wa.me/201063751653" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors">
              <MessageCircle className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Contact Enjy</span>
              <span className="text-xs text-muted-foreground mr-2">WhatsApp</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="tel:+201063751653" className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors">
              <Phone className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Call Enjy</span>
              <span className="text-xs text-muted-foreground mr-2">+20 10 63751653</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://www.google.com/maps?q=29.978662,30.988026" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors">
              <MapPin className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Location</span>
              <span className="text-xs text-muted-foreground mr-2">6th of October</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://www.instagram.com/yoga_together_forlife" target="_blank" rel="noopener noreferrer" className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors">
              <Camera className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Instagram</span>
              <span className="text-xs text-muted-foreground mr-2">@yoga_together_forlife</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <button onClick={() => setShowAbout(true)} className="flex items-center w-full px-4 py-3.5 hover:bg-muted/30 transition-colors">
              <Info className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">About Align with Enjy</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <button onClick={() => router.push('/privacy')} className="flex items-center w-full px-4 py-3.5 hover:bg-muted/30 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#006D77] mr-3" />
              <span className="text-sm text-foreground flex-1 text-left">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          </div>
        </div>

        {/* Log Out + Delete Account */}
        <div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3.5 border-b border-border hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5 text-[#E53935] mr-3" />
              <span className="text-sm font-medium text-[#E53935]">Log Out</span>
            </button>
            <button onClick={() => { setDeleteError(''); setShowDeleteConfirm(true) }} className="flex items-center w-full px-4 py-3.5 hover:bg-red-50 transition-colors">
              <Trash2 className="w-5 h-5 text-[#C62828] mr-3" />
              <span className="text-sm font-medium text-[#C62828]">Delete Account</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">Align with Enjy v1.0</p>

        {/* ── Delete Account Confirmation Modal ── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-5">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-[#C62828]" />
              </div>
              <h2 className="text-lg font-bold text-foreground text-center mb-2">Delete your account?</h2>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
                This will permanently delete your account, bookings, packages, and personal data.
                <span className="font-semibold text-foreground"> This cannot be undone.</span>
              </p>
              {deleteError && (
                <p className="text-xs text-[#C62828] bg-red-50 rounded-xl px-3 py-2 text-center mb-3">{deleteError}</p>
              )}
              <div className="space-y-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="w-full py-3 bg-[#C62828] text-white font-semibold rounded-xl hover:bg-[#a81f1f] transition-colors disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="w-full py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Welcome Onboarding Modal ── */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl overflow-hidden">

            {/* Intro Step */}
            {welcomeStep === 'intro' && (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006D77] to-[#B8612A] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome, {profile.name.split(' ')[0] || 'there'}! 🧘‍♀️
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Your account is approved. Let&apos;s set up two things to make your experience even better.
                </p>
                <div className="space-y-3 text-left mb-6">
                  <div className="flex items-center gap-3 bg-[#E0EEF0] rounded-xl p-3">
                    <Bell className="w-5 h-5 text-[#006D77] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Class Reminders</p>
                      <p className="text-xs text-muted-foreground">Get notified 24h & 2h before your class</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-[#EDD7C9]/30 rounded-xl p-3">
                    <Fingerprint className="w-5 h-5 text-[#B8612A] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Biometric Login</p>
                      <p className="text-xs text-muted-foreground">Log in with your fingerprint or Face ID</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setWelcomeStep('notifications')}
                  className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-2xl hover:bg-[#004E5C] transition-colors"
                >
                  Let&apos;s Set Up →
                </button>
                <button onClick={() => { setShowWelcome(false); router.replace('/') }}
                  className="w-full py-2 text-sm text-muted-foreground mt-2">
                  Skip for now
                </button>
              </div>
            )}

            {/* Notifications Step */}
            {welcomeStep === 'notifications' && (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center">
                    <Bell className="w-8 h-8 text-[#006D77]" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Stay on Track</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Enable notifications to get reminders before your classes — with the sound of a singing bowl 🎵
                </p>

                {pushEnabled ? (
                  <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#4CAF50]" />
                    <p className="text-sm font-medium text-[#4CAF50]">Notifications are enabled!</p>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setPushLoading(true)
                      const result = await subscribeToPush(profile.userId)
                      if (result.ok) {
                        setPushEnabled(true)
                        playTing()
                      }
                      setPushLoading(false)
                    }}
                    disabled={pushLoading || !pushSupported}
                    className="w-full py-3.5 bg-[#006D77] text-white font-bold rounded-2xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
                  >
                    {pushLoading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Bell className="w-5 h-5" /> Enable Notifications</>
                    }
                  </button>
                )}

                <button
                  onClick={() => setWelcomeStep(biometricSupported ? 'biometric' : 'intro')}
                  className="w-full py-3 border border-border rounded-2xl text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                >
                  {biometricSupported ? 'Next →' : 'Finish'}
                </button>
                {!biometricSupported && (
                  <button onClick={() => { setShowWelcome(false); router.replace('/') }}
                    className="w-full py-2 text-sm text-muted-foreground mt-1">
                    Go to Home
                  </button>
                )}
              </div>
            )}

            {/* Biometric Step */}
            {welcomeStep === 'biometric' && (
              <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#EDD7C9]/30 flex items-center justify-center">
                    <Fingerprint className="w-8 h-8 text-[#B8612A]" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Quick Login</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Use your fingerprint or Face ID to log in instantly — no password needed next time.
                </p>

                {biometricEnabled ? (
                  <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#4CAF50]" />
                    <p className="text-sm font-medium text-[#4CAF50]">Biometrics enabled!</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowWelcome(false); setShowBiometricSetup(true) }}
                    className="w-full py-3.5 bg-[#B8612A] text-white font-bold rounded-2xl hover:bg-[#C55200] transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    <Fingerprint className="w-5 h-5" /> Set Up Biometrics
                  </button>
                )}

                <button
                  onClick={() => { setShowWelcome(false); playSingingBowl(0.3); router.replace('/') }}
                  className="w-full py-3 bg-[#006D77] text-white font-bold rounded-2xl hover:bg-[#004E5C] transition-colors"
                >
                  🧘‍♀️ Start Booking Classes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav activePage="profile" />
    </main>
  )
}
