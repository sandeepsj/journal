import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF8F5]">
      <div className="text-center space-y-4 max-w-sm animate-page-enter">
        <div className="text-6xl select-none" aria-hidden="true">🌾</div>
        <h1 className="font-serif text-3xl text-[#2C2825]">Page not found</h1>
        <p className="text-sm text-[#8B7D72] leading-relaxed">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="ghost">← Back to your journal</Button>
        </Link>
      </div>
    </div>
  )
}
