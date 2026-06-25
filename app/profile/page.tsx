'use client'

import { useState } from 'react'
import { ChevronRight, Phone, MapPin, Instagram, Info, LogOut, MessageCircle } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export default function ProfilePage() {
  const [reminders, setReminders] = useState({ whatsapp: true, hour24: true, hour2: false })

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-[#D63384]">SA</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Sarah Ahmed</h2>
        <p className="text-sm text-muted-foreground mt-1">+20 101 234 5678</p>
        <button className="mt-3 text-sm font-medium text-[#D63384]">Edit Profile</button>
      </div>

      <div className="px-4 space-y-4">
        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { label: 'Full Name', value: 'Sarah Ahmed' },
              { label: 'Phone', value: '+20 101 234 5678', badge: 'Verified' },
              { label: 'Email', value: 'sarah@email.com' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < 2 ? 'border-b border-border' : ''}`}>
                <span className="text-sm text-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full">{item.badge}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
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
                  className={`w-11 h-6 rounded-full transition-colors relative ${reminders[item.key] ? 'bg-[#D63384]' : 'bg-gray-200'}`}
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
            {[
              { icon: MessageCircle, label: 'Contact Enjy', subtitle: 'WhatsApp', href: 'https://wa.me/201063751653' },
              { icon: Phone, label: 'Call Enjy', subtitle: '+20 10 63751653', href: 'tel:+201063751653' },
              { icon: MapPin, label: 'Location', subtitle: '6th of October', href: 'https://maps.google.com/?q=First+6th+of+October+Giza+Egypt' },
              { icon: Camera, label: 'Instagram', subtitle: '@yoga_together_forlife', href: 'https://www.instagram.com/yoga_together_forlife' },
              { icon: Info, label: 'About The Wellness Hub', subtitle: '', href: '#' },
            ].map((item, i) => (
              <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className={`flex items-center w-full px-4 py-3.5 ${i < 4 ? 'border-b border-border' : ''} hover:bg-muted/30 transition-colors`}>
                <item.icon className="w-5 h-5 text-[#D63384] mr-3" />
                <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
                {item.subtitle && <span className="text-xs text-muted-foreground mr-2">{item.subtitle}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </a>
            ))}
          </div>
        </div>
        
        {/* Log Out */}
        <div>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <button className="flex items-center w-full px-4 py-3.5 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5 text-[#E53935] mr-3" />
              <span className="text-sm font-medium text-[#E53935]">Log Out</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-4">The Wellness Hub v1.0</p>
      </div>

      <BottomNav activePage="profile" />
    </main>
  )
}
