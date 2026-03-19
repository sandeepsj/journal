import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm animate-page-enter">
        <div className="text-6xl select-none" aria-hidden="true">🌾</div>
        <h1 className="font-serif text-3xl text-[var(--color-text-primary)]">Page not found</h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="ghost">← Back to your journal</Button>
        </Link>
      </div>
    </div>
  )
}
