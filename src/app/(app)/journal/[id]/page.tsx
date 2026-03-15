import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { JournalEditor } from '@/components/journal/JournalEditor'

type Params = { params: Promise<{ id: string }> }

export default async function EditJournalPage({ params }: Params) {
  const { id } = await params
  const session = await auth()

  await connectDB()

  const entry = await JournalEntry.findOne({
    _id: id,
    userId: session!.user.id,
  })
    .select('-embedding')
    .lean()

  if (!entry) notFound()

  return (
    <JournalEditor
      entryId={id}
      initialTitle={entry.title}
      initialBody={entry.body}
      initialMood={entry.mood}
      initialTextColor={entry.textColor ?? '#2C2825'}
      initialDrawing={entry.drawing ?? null}
      initialPinned={entry.pinned ?? false}
    />
  )
}
