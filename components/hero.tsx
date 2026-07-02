'use client'

export function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#006D77] to-[#B8612A] px-4 py-20 flex flex-col justify-center items-center text-center overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10 bg-white mix-blend-multiply"></div>
      <div className="absolute bottom-20 left-5 w-40 h-40 rounded-full opacity-10 bg-white mix-blend-multiply"></div>

      <div className="relative z-10 max-w-md">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Align with Enjy
        </h1>
        <p className="text-xl text-white/90 mb-8 leading-relaxed">
          Your sanctuary for yoga, fitness & wellness in the heart of Egypt
        </p>
        <p className="text-lg text-white/80 mb-10 italic">
          Exclusively designed for women by trainer Enjy Gebril
        </p>
        <button className="bg-white text-[#006D77] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
          Book a Class
        </button>
      </div>
    </section>
  )
}
