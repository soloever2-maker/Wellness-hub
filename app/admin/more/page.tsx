'use client'

import { useState, useEffect } from 'react'
import { Package, CreditCard, ClipboardList, Megaphone, Clock, Bell, Snowflake, User, ChevronRight, LogOut, X, Check, Loader2, Download, Dumbbell, MapPin } from 'lucide-react'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logoutUser } from '@/lib/auth'

type SettingKey = 'cancellation_window_hours' | 'max_freeze_days' | 'reminder_timing'

type Stats = {
  packagesCount: number
  paymentsTotal: number
  waitlistCount: number
}

type Settings = {
  cancellation_window_hours: string
  max_freeze_days: string
  reminder_timing: string
}

export default function AdminMorePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ packagesCount: 0, paymentsTotal: 0, waitlistCount: 0 })
  const [settings, setSettings] = useState<Settings>({
    cancellation_window_hours: '12',
    max_freeze_days: '14',
    reminder_timing: '24h, 2h',
  })
  const [loading, setLoading] = useState(true)
  const [editSetting, setEditSetting] = useState<SettingKey | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Real counts from Supabase
      const [pkgRes, payRes, waitRes, settingsRes] = await Promise.all([
        supabase.from('packages').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('payments').select('amount').eq('status', 'paid'),
        supabase.from('waitlist').select('id', { count: 'exact' }).eq('status', 'waiting'),
        supabase.from('settings').select('key, value'),
      ])

      const total = payRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      setStats({
        packagesCount: pkgRes.count || 0,
        paymentsTotal: total,
        waitlistCount: waitRes.count || 0,
      })

      if (settingsRes.data) {
        const map: Record<string, string> = {}
        settingsRes.data.forEach(s => { map[s.key] = s.value })
        setSettings(prev => ({
          cancellation_window_hours: map['cancellation_window_hours'] ?? prev.cancellation_window_hours,
          max_freeze_days: map['max_freeze_days'] ?? prev.max_freeze_days,
          reminder_timing: map['reminder_timing'] ?? prev.reminder_timing,
        }))
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const openEdit = (key: SettingKey) => {
    setEditSetting(key)
    setEditValue(settings[key])
  }

  const saveSetting = async () => {
    if (!editSetting) return
    setSaving(true)
    await supabase.from('settings')
      .upsert({ key: editSetting, value: editValue }, { onConflict: 'key' })
    setSettings(prev => ({ ...prev, [editSetting]: editValue }))
    setSaving(false)
    setEditSetting(null)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutUser()
    router.replace('/login')
  }

  const settingLabel: Record<SettingKey, { label: string; desc: string; hint: string }> = {
    cancellation_window_hours: {
      label: 'Cancellation Window',
      desc: 'Hours before class that client can cancel',
      hint: 'Enter number of hours (e.g. 12)',
    },
    max_freeze_days: {
      label: 'Max Freeze Duration',
      desc: 'Maximum days a package can be frozen',
      hint: 'Enter number of days (e.g. 14)',
    },
    reminder_timing: {
      label: 'Reminder Timing',
      desc: 'When to send class reminders',
      hint: 'e.g. 24h, 2h',
    },
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">More</h1>
      </div>

      <div className="px-4 pt-4 space-y-6">

        {/* Management */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Management</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              {
                icon: Dumbbell, label: 'Class Types', desc: 'Add or remove class types',
                href: '/admin/classes', value: '',
              },
              {
                icon: Package, label: 'Package Editor', desc: 'Edit prices, names, validity',
                href: '/admin/packages-editor',
                value: loading ? '—' : `${stats.packagesCount} packages`,
              },
              {
                icon: CreditCard, label: 'Payments', desc: 'Transaction history & export',
                href: '/admin/payments',
                value: loading ? '—' : stats.paymentsTotal > 0 ? `${stats.paymentsTotal.toLocaleString()} EGP` : 'No payments',
              },
              {
                icon: ClipboardList, label: 'Waitlist', desc: 'Manage waitlists per class',
                href: '/admin/waitlist',
                value: loading ? '—' : stats.waitlistCount > 0 ? `${stats.waitlistCount} waiting` : 'Empty',
              },
              {
                icon: Download, label: 'Export Reports', desc: 'Download Excel — clients, bookings, revenue',
                href: '/admin/export', value: '',
              },
              {
                icon: Megaphone, label: 'Broadcast', desc: 'Send Push to client groups',
                href: '/admin/broadcast', value: '',
              },
              {
                icon: MapPin, label: 'Retreats', desc: 'Create & manage retreat announcements',
                href: '/admin/retreats', value: '',
              },
            ].map((item, i, arr) => (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFD9B8]/10 transition-colors ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
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

        {/* Settings */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Settings</h3>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {(Object.keys(settingLabel) as SettingKey[]).map((key, i, arr) => (
              <button key={key} onClick={() => openEdit(key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFD9B8]/10 transition-colors text-left ${i < arr.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#E0EEF0] flex items-center justify-center">
                  {key === 'cancellation_window_hours' && <Clock className="w-5 h-5 text-[#E86500]" />}
                  {key === 'max_freeze_days' && <Snowflake className="w-5 h-5 text-[#E86500]" />}
                  {key === 'reminder_timing' && <Bell className="w-5 h-5 text-[#E86500]" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{settingLabel[key].label}</p>
                  <p className="text-xs text-muted-foreground">{settingLabel[key].desc}</p>
                </div>
                <span className="text-xs font-medium text-[#006D77] mr-1">{settings[key]}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}

            {/* My Account */}
            <Link href="/admin/approvals"
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#FFD9B8]/10 transition-colors border-t border-border"
            >
              <div className="w-9 h-9 rounded-xl bg-[#E0EEF0] flex items-center justify-center">
                <User className="w-5 h-5 text-[#E86500]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Approvals</p>
                <p className="text-xs text-muted-foreground">Review pending clients</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Log Out */}
        <div>
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full bg-white border border-border rounded-2xl shadow-sm flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              {loggingOut
                ? <Loader2 className="w-5 h-5 text-[#E53935] animate-spin" />
                : <LogOut className="w-5 h-5 text-[#E53935]" />
              }
            </div>
            <span className="text-sm font-medium text-[#E53935]">
              {loggingOut ? 'Signing out...' : 'Log Out'}
            </span>
          </button>
        </div>
      </div>

      {/* Setting Edit Modal */}
      {editSetting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setEditSetting(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">{settingLabel[editSetting].label}</h3>
              <button onClick={() => setEditSetting(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{settingLabel[editSetting].hint}</p>

            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground text-base focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77] mb-4"
            />

            <button onClick={saveSetting} disabled={saving || !editValue.trim()}
              className="w-full py-3 bg-[#006D77] text-white font-semibold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Check className="w-5 h-5" /> Save Setting</>
              }
            </button>
          </div>
        </div>
      )}

      <AdminBottomNav activePage="more" />
    </main>
  )
}
