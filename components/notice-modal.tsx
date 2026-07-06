'use client'

// Single-button informational modal — the alert() replacement.
// Same visual language as ConfirmModal.

import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface NoticeModalProps {
  open: boolean
  title: string
  message: string
  variant?: 'info' | 'error' | 'success'
  buttonLabel?: string
  onClose: () => void
}

export function NoticeModal({
  open, title, message,
  variant = 'info',
  buttonLabel = 'OK',
  onClose,
}: NoticeModalProps) {
  if (!open) return null

  const iconBg =
    variant === 'error' ? 'bg-[#E53935]/10' :
    variant === 'success' ? 'bg-[#4CAF50]/10' :
    'bg-[#006D77]/10'
  const iconColor =
    variant === 'error' ? 'text-[#E53935]' :
    variant === 'success' ? 'text-[#4CAF50]' :
    'text-[#006D77]'
  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        <h3 className="text-lg font-bold text-foreground text-center mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">{message}</p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#006D77]"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
