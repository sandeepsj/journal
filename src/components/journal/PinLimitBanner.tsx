'use client'

import { useEffect } from 'react'

export interface PinLimitBannerProps {
  message: string
  onDismiss: () => void
}

export function PinLimitBanner({ message, onDismiss }: PinLimitBannerProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="flex items-center justify-between gap-3 bg-[#FFF0ED] border border-[#C4614E]/20 text-[#C4614E] text-sm rounded-xl px-4 py-2 animate-slide-up">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-[#C4614E]/60 hover:text-[#C4614E] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C4614E] rounded"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
