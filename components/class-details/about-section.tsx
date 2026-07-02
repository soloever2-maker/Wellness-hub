import { Check } from 'lucide-react'

export function AboutSection() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">About This Class</h2>
        <p className="text-sm text-secondary-foreground leading-relaxed">
          A dynamic flow combining strength and flexibility. Perfect for building endurance while finding your inner calm. This class bridges the gap between traditional yoga and cardio for a holistic workout experience.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">What to Bring</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary font-bold" />
            </div>
            <span className="text-sm text-foreground">Yoga mat</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary font-bold" />
            </div>
            <span className="text-sm text-foreground">Water bottle</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary font-bold" />
            </div>
            <span className="text-sm text-foreground">Towel</span>
          </div>
        </div>
      </div>
    </div>
  )
}
