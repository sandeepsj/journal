'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-[#2C2825] font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl select-none">🌿</div>
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-[#8B7D72]">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg border border-[#E8E2D9] bg-white hover:bg-[#F2EEE8] transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
