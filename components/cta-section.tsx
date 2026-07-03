'use client'

import { Heart, Users, Zap } from 'lucide-react'

const benefits = [
  {
    icon: Heart,
    title: 'Women-Focused Community',
    description: 'A supportive space designed exclusively for women to grow, strengthen, and heal together',
  },
  {
    icon: Users,
    title: 'Expert Guidance',
    description: 'Learn from Enjy with personalized attention and adaptations for your unique needs',
  },
  {
    icon: Zap,
    title: 'Holistic Wellness',
    description: 'Balance strength training, flexibility, mindfulness, and nutrition in one place',
  },
]

export function CTASection() {
  return (
    <section className="py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#006D77] to-[#B8612A] text-white mb-6 shadow-lg">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Main CTA */}
        <div className="bg-gradient-to-r from-[#006D77] to-[#B8612A] rounded-3xl p-8 md:p-16 text-white text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Ready to Transform Your Wellness?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join Align with Enjy community and begin your journey toward strength, balance, and inner peace with Enjy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-[#006D77] px-8 py-4 rounded-full font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Book Now
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-center">
          {[
            { number: '500+', label: 'Happy Members' },
            { number: '10+', label: 'Years Experience' },
            { number: '15+', label: 'Class Types' },
            { number: '6', label: 'Days/Week' },
          ].map((stat, idx) => (
            <div key={idx}>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#006D77] to-[#B8612A] bg-clip-text text-transparent">
                {stat.number}
              </p>
              <p className="text-muted-foreground text-sm mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
