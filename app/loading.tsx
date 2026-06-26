import Image from 'next/image'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #FAFAF7 0%, #E0EEF0 50%, #FFD9B8 100%)' }}>
      <div className="flex flex-col items-center gap-5">
        {/* App icon with breathing animation */}
        <div className="animate-pulse-slow" style={{ mixBlendMode: 'multiply' }}>
          <Image src="/icon.png" alt="" width={100} height={100} className="object-contain" priority />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#006D77] tracking-wide">Align with Enjy</h1>
          <p className="text-[10px] text-[#E86500] font-semibold tracking-[0.25em] uppercase mt-1">
            Wellness & Yoga Center
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
