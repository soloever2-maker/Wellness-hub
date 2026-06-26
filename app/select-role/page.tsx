'use client'

import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { LayoutDashboard, Smartphone } from 'lucide-react'

export default function SelectRolePage() {
  const router = useRouter()

  return (
    <main className="bg-background min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-full bg-white shadow-xl border border-[#E0EEF0] flex items-center justify-center mb-4 ring-4 ring-[#E0EEF0]/40">
          <Logo variant="icon" size="sm" className="w-16 h-16 object-contain" />
        </div>
        <h1 className="text-xl font-bold text-[#006D77]">Align with Enjy</h1>
        <p className="text-xs text-[#E86500] font-medium tracking-wider uppercase mt-1">Welcome back, Enjy 👋</p>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-2">Where would you like to go?</h2>
      <p className="text-sm text-muted-foreground mb-8 text-center">Choose which view to open</p>

      <div className="w-full max-w-sm space-y-4">
        {/* Client App */}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-white border-2 border-[#E0EEF0] hover:border-[#006D77] rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E0EEF0] group-hover:bg-[#006D77]/10 flex items-center justify-center transition-colors">
            <Smartphone className="w-6 h-6 text-[#006D77]" />
          </div>
          <div className="text-left">
            <p className="font-bold text-foreground">Client App</p>
            <p className="text-xs text-muted-foreground mt-0.5">Browse classes, book sessions, view your package</p>
          </div>
        </button>

        {/* Admin Panel */}
        <button
          onClick={() => router.push('/admin')}
          className="w-full bg-[#006D77] hover:bg-[#004E5C] rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md shadow-lg shadow-[#006D77]/20 group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-white">Admin Panel</p>
            <p className="text-xs text-white/70 mt-0.5">Manage bookings, clients, schedule & more</p>
          </div>
        </button>
      </div>
    </main>
  )
}
