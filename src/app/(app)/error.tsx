'use client'

import { Button } from '@/components/ui/Button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm animate-page-enter">
        <div className="text-5xl select-none" aria-hidden="true">🌿</div>
        <h2 className="font-serif text-2xl text-[#2C2825]">Something went wrong</h2>
        <p className="text-sm text-[#8B7D72] leading-relaxed">
          {error.message || 'An unexpected error occurred. Your journal entries are safe.'}
        </p>
        {error.digest && (
          <p className="text-xs text-[#B5A99F] font-mono">{error.digest}</p>
        )}
        <Button onClick={reset} variant="ghost">
          Try again
        </Button>
      </div>
    </div>
  )
}
