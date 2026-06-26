'use client'

import { useState } from 'react'
import { ChevronRight, Phone, MapPin, Camera, Info, LogOut, MessageCircle, X, Check } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { Logo } from '@/components/logo'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [reminders, setReminders] = useState({ whatsapp: true, hour24: true, hour2: false })
  const [isEditing, setIsEditing] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [profile, setProfile] = useState({ name: 'Sarah Ahmed', phone: '+20 101 234 5678', email: 'sarah@email.com' })
  const [editForm, setEditForm] = useState(profile)

  const handleSave = () => {
    setProfile(editForm)
    setIsEditing(false)
  }

  const handleLogout = () => {
    router.push('/login')
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-[#006D77]">{profile.name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
        <button
          onClick={() => { setEditForm(profile); setIsEditing(true) }}
          className="mt-3 text-sm font-medium text-[#006D77]"
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
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Save Changes
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
        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'Full Name', value: profile.name },
              { label: 'Phone', value: profile.phone, badge: 'Verified' },
              { label: 'Email', value: profile.email },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < 2 ? 'border-b border-border' : ''}`}>
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
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Notifications</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'WhatsApp Reminders', key: 'whatsapp' as const },
              { label: '24-hour reminder', key: 'hour24' as const },
              { label: '2-hour reminder', key: 'hour2' as const },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < 2 ? 'border-b border-border' : ''}`}>
                <span className="text-sm text-foreground">{item.label}</span>
                <button
                  onClick={() => setReminders(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${reminders[item.key] ? 'bg-[#006D77]' : 'bg-gray-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${reminders[item.key] ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Support</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
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

        {/* Log Out */}
        <div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-3.5 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5 text-[#E53935] mr-3" />
              <span className="text-sm font-medium text-[#E53935]">Log Out</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">Align with Enjy v1.0</p>
      </div>

      <BottomNav activePage="profile" />
    </main>
  )
}
