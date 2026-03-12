import { auth } from '@/lib/auth/options'
import { RecallAppLayout } from '@/components/journal/RecallAppLayout'

export default async function RecallPage() {
  const session = await auth()
  const user = session!.user

  return (
    <RecallAppLayout
      userName={user.name ?? 'You'}
      userEmail={user.email ?? undefined}
      userImage={user.image ?? null}
    />
  )
}
