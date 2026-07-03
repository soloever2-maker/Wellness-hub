'use client'

import { Flame, Wind, Heart } from 'lucide-react'

const classes = [
  {
    id: 1,
    name: 'Vinyasa Flow',
    description: 'Dynamic movement paired with breath',
    duration: '60 min',
    level: 'All Levels',
    icon: Flame,
    color: 'from-[#006D77] to-[#B8612A]',
  },
  {
    id: 2,
    name: 'Restorative Yoga',
    description: 'Deep relaxation and healing',
    duration: '75 min',
    level: 'Beginner',
    icon: Wind,
    color: 'from-[#EDD7C9] to-[#B8612A]',
  },
  {
    id: 3,
    name: 'Power Fitness',
    description: 'Strength and endurance training',
    duration: '45 min',
    level: 'Intermediate',
    icon: Heart,
    color: 'from-[#006D77] to-[#B8612A]',
  },
]

export function FeaturedClasses() {
  return (
    <section className="py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Classes
          </h2>
          <p className="text-xl text-muted-foreground">
            Find the perfect class for your wellness journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const Icon = cls.icon
            return (
              <div
                key={cls.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Class header with gradient */}
                <div
                  className={`bg-gradient-to-br ${cls.color} p-8 text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                  <Icon className="w-12 h-12 mb-4 relative z-10" />
                  <h3 className="text-2xl font-bold mb-2 relative z-10">{cls.name}</h3>
                </div>

                {/* Class content */}
                <div className="p-6">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {cls.description}
                  </p>

                  <div className="flex justify-between items-center mb-6 text-sm">
                    <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                      {cls.duration}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {cls.level}
                    </span>
                  </div>

                  <button className="w-full bg-gradient-to-r from-[#006D77] to-[#B8612A] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    Learn More
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
