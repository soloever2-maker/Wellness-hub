import { Lock } from 'lucide-react'

export function PackagesInfoNote() {
  return (
    <div className="space-y-4 mt-8">
      {/* Benefits box */}
      <div className="bg-secondary rounded-[16px] p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">✓</span>
          <p className="text-sm text-foreground">All packages include access to every class type</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">✓</span>
          <p className="text-sm text-foreground">Sessions deducted only when you attend</p>
        </div>
      </div>

      {/* Payment info */}
      <div className="flex items-center justify-center gap-2 px-4 py-3">
        <Lock className="w-4 h-4 text-secondary-foreground" />
        <p className="text-xs text-secondary-foreground text-center">
          Secure payment via Paymob — Visa, Mastercard & wallets
        </p>
      </div>
    </div>
  )
}
