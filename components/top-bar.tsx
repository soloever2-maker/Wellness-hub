import { Bell } from 'lucide-react'
import { Logo } from './logo'

export function TopBar() {
  return (
    <div className="bg-background px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-border/50">
      <div className="flex items-center gap-2">
        <Logo variant="icon" size="sm" className="w-10 h-10" />
        <div>
          <p className="text-xs text-muted-foreground">Good morning</p>
          <h1 className="text-base font-bold text-foreground leading-tight">Sarah 👋</h1>
        </div>
      </div>
      <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-foreground" />
      </button>
    </div>
  )
}
