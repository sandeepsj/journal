import { RecallAppLayout } from '@/components/journal/RecallAppLayout'
import { useAuth } from '@/contexts/AuthContext'

export function RecallPage() {
  const { user } = useAuth()

  return (
    <RecallAppLayout
      userName={user?.name ?? 'User'}
      userEmail={user?.email}
      userImage={user?.picture}
    />
  )
}
