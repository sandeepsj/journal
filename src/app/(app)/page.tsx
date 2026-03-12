import { auth } from '@/lib/auth/options'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { DashboardView } from '@/components/journal/DashboardView'

export default async function DashboardPage() {
  const session = await auth()
  const user = session!.user

  return (
    <div className="min-h-screen">
      <NavbarClient
        userName={user.name ?? 'You'}
        userEmail={user.email ?? undefined}
        userImage={user.image ?? null}
      />
      <DashboardView userName={user.name ?? 'You'} />
    </div>
  )
}
