import { auth } from '@/lib/auth/options'
import { NavbarClient } from '@/components/layout/NavbarClient'
import { RecallPanel } from '@/components/journal/RecallPanel'

export default async function RecallPage() {
  const session = await auth()
  const user = session!.user

  return (
    <div className="min-h-screen">
      <NavbarClient
        userName={user.name ?? 'You'}
        userEmail={user.email ?? undefined}
        userImage={user.image ?? null}
      />
      <div className="max-w-2xl mx-auto px-4 py-10 animate-page-enter">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-[#2C2825] mb-2">Ask your journal</h1>
          <p className="text-base text-[#B5A99F]">
            Ask anything — your journal remembers what you wrote.
          </p>
        </div>
        <RecallPanel expanded />
      </div>
    </div>
  )
}
