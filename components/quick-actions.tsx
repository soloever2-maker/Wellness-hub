import Link from 'next/link'
import { Calendar, Package, MessageCircle } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="space-y-2.5">

      {/* Primary — Book a Class */}
      <Link href="/schedule"
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg shadow-[#006D77]/20 hover:opacity-90 active:scale-[0.98] transition-all"
        style={{ background: 'linear-gradient(135deg, #006D77 0%, #004E5C 100%)' }}
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        Book a Class
      </Link>

      {/* Secondary — 2 col */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/my-package"
          className="flex items-center justify-center gap-2 py-3.5 bg-white border border-[#006D77]/20 text-[#006D77] rounded-2xl font-semibold text-sm hover:bg-[#E0EEF0] active:scale-[0.97] transition-all shadow-sm">
          <Package className="w-4 h-4" />
          My Package
        </Link>
        <a href="https://wa.me/201063751653" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 bg-white border border-[#25D366]/25 text-[#1a9e4a] rounded-2xl font-semibold text-sm hover:bg-[#25D366]/5 active:scale-[0.97] transition-all shadow-sm">
          <MessageCircle className="w-4 h-4" />
          Contact Enjy
        </a>
      </div>

    </div>
  )
}
