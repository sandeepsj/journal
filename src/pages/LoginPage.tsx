import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LoadingDots } from '@/components/ui/LoadingDots'

export function LoginPage() {
  const { user, isLoading, signIn } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots size="md" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 animate-page-enter">
        <h1 className="font-serif text-5xl text-[var(--color-text-primary)]">Muse</h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          A space to remember yourself
        </p>
        <Button onClick={signIn}>
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}
