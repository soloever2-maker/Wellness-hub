'use client'

import { Clock, MapPin } from 'lucide-react'

const schedule = [
  {
    day: 'Monday',
    classes: [
      { time: '6:00 AM', name: 'Morning Flow', instructor: 'Enjy' },
      { time: '6:00 PM', name: 'Power Fitness', instructor: 'Enjy' },
    ],
  },
  {
    day: 'Tuesday',
    classes: [
      { time: '9:00 AM', name: 'Restorative Yoga', instructor: 'Enjy' },
      { time: '7:00 PM', name: 'Vinyasa Flow', instructor: 'Enjy' },
    ],
  },
  {
    day: 'Wednesday',
    classes: [
      { time: '6:00 AM', name: 'Power Fitness', instructor: 'Enjy' },
      { time: '6:00 PM', name: 'Yin Yoga', instructor: 'Enjy' },
    ],
  },
  {
    day: 'Thursday',
    classes: [
      { time: '9:00 AM', name: 'Morning Flow', instructor: 'Enjy' },
      { time: '7:00 PM', name: 'Vinyasa Flow', instructor: 'Enjy' },
    ],
  },
  {
    day: 'Friday',
    classes: [
      { time: '6:00 AM', name: 'Sunrise Yoga', instructor: 'Enjy' },
      { time: '5:00 PM', name: 'Restorative Yoga', instructor: 'Enjy' },
    ],
  },
  {
    day: 'Saturday',
    classes: [
      { time: '8:00 AM', name: 'Power Fitness', instructor: 'Enjy' },
      { time: '10:00 AM', name: 'Vinyasa Flow', instructor: 'Enjy' },
      { time: '5:00 PM', name: 'Yin Yoga', instructor: 'Enjy' },
    ],
  },
]

export function Schedule() {
  return (
    <section className="py-16 px-4 md:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Weekly Schedule
          </h2>
          <p className="text-xl text-muted-foreground">
            Find the perfect time that fits your routine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedule.map((day) => (
            <div
              key={day.day}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-[#006D77] to-[#B8612A] rounded mr-3"></span>
                {day.day}
              </h3>

              <div className="space-y-3">
                {day.classes.map((cls, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-accent/5 to-secondary/5 p-4 rounded-lg border border-border hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Clock className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {cls.time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cls.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      with {cls.instructor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-[#006D77] to-[#B8612A] rounded-2xl p-8 md:p-12 text-white text-center">
          <MapPin className="w-8 h-8 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl md:text-3xl font-bold mb-3">
            Located in Cairo, Egypt
          </h3>
          <p className="text-white/90 mb-6 max-w-md mx-auto">
            Visit us at our wellness studio to experience the perfect blend of yoga, fitness, and wellness in a welcoming environment designed just for you.
          </p>
          <button className="bg-white text-secondary px-8 py-3 rounded-lg font-bold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl">
            Get Directions
          </button>
        </div>
      </div>
    </section>
  )
}
