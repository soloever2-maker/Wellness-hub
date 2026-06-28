import Image from 'next/image'

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #FAFAF7 0%, #E0EEF0 50%, #FFD9B8 100%)' }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* App icon */}
        <div className="animate-pulse" style={{ mixBlendMode: 'multiply', animationDuration: '2s' }}>
          <Image src="/icon.png" alt="" width={100} height={100} className="object-contain" priority />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#006D77] tracking-wide">Align with Enjy</h1>
          <p className="text-[10px] text-[#E86500] font-semibold tracking-[0.25em] uppercase mt-1">
            Wellness & Yoga Center
          </p>
        </div>

        {/* Loading bar (matches page-transition style) */}
        <div className="w-32 h-1 bg-[#006D77]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#006D77] to-[#E86500] rounded-full animate-loading-bar"
          />
        </div>
      </div>
    </div>
  )
}
