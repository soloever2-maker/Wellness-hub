// ============================================================
// NEW FILE — save at:
//   components/change-password-row.tsx
// Self-contained "Change Password" row + modal.
// Used inside the Security card on the profile page.
// ============================================================

'use client'

import { useState } from 'react'
import { Lock, ChevronRight, X, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/lib/auth'

export function ChangePasswordRow() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowNew(false)
    setError('')
    setSuccess(false)
    setLoading(false)
  }

  const close = () => {
    setOpen(false)
    reset()
  }

  const handleSubmit = async () => {
    setError('')

    if (!currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current one.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setTimeout(close, 1800)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#006D77]/30 focus:border-[#006D77]'

  return (
    <>
      {/* Row */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-background/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-[#006D77]" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Change Password</h3>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {success ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-[#4CAF50]" />
                </div>
                <p className="text-sm font-medium text-foreground">Password updated!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setError('') }}
                    placeholder="Enter current password"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError('') }}
                      placeholder="At least 6 characters"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Confirm New Password
                  </label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                    placeholder="Re-enter new password"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-2.5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 bg-[#006D77] text-white hover:bg-[#004E5C] disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
