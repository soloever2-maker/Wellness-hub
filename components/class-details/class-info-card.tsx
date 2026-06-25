import { Clock, Calendar, Zap, BarChart3 } from 'lucide-react'

export function ClassInfoCard() {
  return (
    <div className="mx-4 -mt-10 relative z-10">
      <div className="bg-surface rounded-[16px] p-6 shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Power Yoga</h1>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 bg-secondary rounded-full py-2 px-4 w-fit">
            <Clock className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">11:00 AM – 12:00 PM</span>
          </div>

          <div className="flex items-center gap-3 bg-secondary rounded-full py-2 px-4 w-fit">
            <Calendar className="w-4 h-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">Sunday, July 6</span>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-secondary rounded-full py-2 px-4 w-fit">
              <Zap className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">60 min</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary rounded-full py-2 px-4 w-fit">
              <BarChart3 className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">All Levels</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
            EG
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Enjy Gebril</p>
            <p className="text-xs text-secondary-foreground">Instructor</p>
          </div>
        </div>
      </div>
    </div>
  )
}
