import { ArrowLeft, Share2 } from 'lucide-react'
import Link from 'next/link'

export function ClassHeader() {
  return (
    <div className="bg-gradient-to-r from-[#D63384] to-[#7B2D8E] h-52 relative flex items-center justify-center">
      <Link href="/" className="absolute top-6 left-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all">
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>

      <div className="text-7xl">🧘‍♀️</div>

      <button className="absolute top-6 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all">
        <Share2 className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}
