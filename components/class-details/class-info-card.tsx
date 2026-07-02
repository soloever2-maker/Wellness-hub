import { Clock, Calendar, Zap, BarChart3 } from 'lucide-react'

export function ClassInfoCard() {
  return (
    <div className="-mt-8 relative z-10">
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Power Yoga</h1>

        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-2 bg-[#EDD7C9]/30 rounded-full py-2 px-3">
            <Clock className="w-3.5 h-3.5 text-[#006D77]" />
            <span className="text-xs font-medium text-foreground">11:00 AM – 12:00 PM</span>
          </div>
          <div className="flex items-center gap-2 bg-[#EDD7C9]/30 rounded-full py-2 px-3">
            <Calendar className="w-3.5 h-3.5 text-[#006D77]" />
            <span className="text-xs font-medium text-foreground">Sunday, July 6</span>
          </div>
          <div className="flex items-center gap-2 bg-[#EDD7C9]/30 rounded-full py-2 px-3">
            <Zap className="w-3.5 h-3.5 text-[#006D77]" />
            <span className="text-xs font-medium text-foreground">60 min</span>
          </div>
          <div className="flex items-center gap-2 bg-[#EDD7C9]/30 rounded-full py-2 px-3">
            <BarChart3 className="w-3.5 h-3.5 text-[#006D77]" />
            <span className="text-xs font-medium text-foreground">All Levels</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006D77] to-[#B8612A] flex items-center justify-center text-white font-bold text-sm">
            EG
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Enjy Gebril</p>
            <p className="text-xs text-muted-foreground">Instructor</p>
          </div>
        </div>
      </div>
    </div>
  )
}
