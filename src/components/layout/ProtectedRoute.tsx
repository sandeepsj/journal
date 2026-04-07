import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingDots } from '@/components/ui/LoadingDots'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots size="md" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
