import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 animate-page-enter">
        <h1 className="font-serif text-6xl text-[var(--color-text-primary)]">404</h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          This page doesn't exist.
        </p>
        <Link to="/">
          <Button variant="ghost">Back to journal</Button>
        </Link>
      </div>
    </div>
  )
}
