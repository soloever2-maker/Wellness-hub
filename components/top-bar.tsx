import { Bell } from 'lucide-react'

export function TopBar() {
  return (
    <div className="bg-background px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-border/50">
      <div>
        <p className="text-xs text-muted-foreground">Good morning</p>
        <h1 className="text-lg font-bold text-foreground">Sarah 👋</h1>
      </div>
      <button className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted transition-colors relative">
        <Bell className="w-5 h-5 text-foreground" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E86500]" />
      </button>
    </div>
  )
}
