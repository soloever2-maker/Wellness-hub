import { MonsteraLeaf } from '@/components/monstera-leaf'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #FAFAF7 0%, #E0EEF0 100%)' }}>
      <div className="flex flex-col items-center gap-5">
        {/* Monstera Leaf — breathing animation */}
        <div className="animate-pulse-slow">
          <MonsteraLeaf size={90} />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#006D77] tracking-wide">Align with Enjy</h1>
          <p className="text-[10px] text-[#E86500] font-semibold tracking-[0.25em] uppercase mt-1">
            Wellness & Yoga Center
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
