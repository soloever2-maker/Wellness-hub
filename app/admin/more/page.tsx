'use client'

import { Package, CreditCard, ClipboardList, Megaphone, Clock, Bell, Snowflake, User, ChevronRight, LogOut } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import Link from 'next/link'

const managementItems = [
  { icon: Package, label: 'Package Editor', desc: 'Edit prices, names, validity', href: '/admin/packages-editor', value: '4 packages' },
  { icon: CreditCard, label: 'Payments', desc: 'Transaction history & export', href: '/admin/payments', value: '15,600 EGP' },
  { icon: ClipboardList, label: 'Waitlist', desc: 'Manage waitlists per class', href: '/admin/waitlist', value: '5 waiting' },
  { icon: Megaphone, label: 'Broadcast', desc: 'Send WhatsApp to client groups', href: '/admin/broadcast', value: '' },
]

const settingsItems = [
  { icon: Clock, label: 'Cancellation Window', value: '12 hours' },
  { icon: Bell, label: 'Reminder Timing', value: '24h, 2h' },
  { icon: Snowflake, label: 'Freeze Rules', value: 'Max 14 days' },
  { icon: User, label: 'My Account', value: '' },
]

export default function AdminMorePage() {
  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">More</h1>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Management Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Management</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {managementItems.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFD9B8]/10 transition-colors ${i < managementItems.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFD9B8]/30 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#006D77]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* Settings Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Settings</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {settingsItems.map((item, i) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFD9B8]/10 transition-colors text-left ${i < settingsItems.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#E0EEF0] flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#E86500]" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div>
          <button className="w-full bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-[#E53935]" />
            </div>
            <span className="text-sm font-medium text-[#E53935]">Log Out</span>
          </button>
        </div>
      </div>

      <AdminBottomNav activePage="more" />
    </main>
  )
}
