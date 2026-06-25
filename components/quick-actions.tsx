import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Link href="/schedule" className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] text-white px-4 py-3 rounded-full font-semibold text-sm hover:shadow-md transition-shadow text-center">
        Book a Class
      </Link>
      <Link href="/my-package" className="bg-white border-2 border-primary text-primary px-4 py-3 rounded-full font-semibold text-sm hover:bg-secondary/20 transition-colors text-center">
        My Package
      </Link>
      <a href="https://wa.me/201063751653" target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-border text-foreground px-4 py-3 rounded-full font-semibold text-sm hover:bg-muted transition-colors text-center">
        Contact Enjy
      </a>
    </div>
  )
}
