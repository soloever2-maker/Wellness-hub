'use client'

import { Star } from 'lucide-react'

export function TrainerSection() {
  return (
    <section className="py-16 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Trainer image placeholder with elegant styling */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#006D77] to-[#E86500] rounded-3xl blur-3xl opacity-30 -z-10"></div>
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-[#FFD9B8] to-[#E86500] p-1">
                <div className="w-full h-full rounded-3xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-muted-foreground text-center">
                  <span className="text-lg font-medium">Trainer Profile Image</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-gradient-to-r from-[#006D77] to-[#E86500]"></div>
              <span className="text-sm font-bold uppercase tracking-widest text-primary">
                Meet Your Trainer
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Enjy Gebril
            </h2>

            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              With over a decade of experience in yoga and fitness, Enjy has dedicated her career to empowering women through movement, mindfulness, and wellness. Her holistic approach combines traditional yoga philosophy with modern fitness techniques.
            </p>

            <div className="mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <p className="text-foreground">
                  <span className="font-semibold">Specialized Training:</span> Vinyasa Flow, Restorative Yoga, and Power Fitness
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <p className="text-foreground">
                  <span className="font-semibold">Mission:</span> Create a safe, judgment-free sanctuary for women to discover their strength
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <p className="text-foreground">
                  <span className="font-semibold">Belief:</span> Wellness is a journey, not a destination—celebrate every step
                </p>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#006D77] to-[#E86500] text-white px-8 py-4 rounded-full font-bold hover:shadow-lg transition-all duration-300 hover:scale-105">
              Book a Session
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
