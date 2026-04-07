import { Navbar } from '@/components/layout/Navbar'
import { DashboardView } from '@/components/journal/DashboardView'
import { useAuth } from '@/contexts/AuthContext'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <>
      <Navbar
        userName={user?.name ?? 'User'}
        userEmail={user?.email}
        userImage={user?.picture}
        onSignOut={signOut}
      />
      <DashboardView userName={user?.name ?? 'User'} />
    </>
  )
}
