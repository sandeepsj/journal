import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import type { PinnedEntryCard } from '@/types/journal'

// GET /api/journal/pinned — return up to 10 pinned entries for current user
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const rawEntries = await JournalEntry.find({ userId: session.user.id, pinned: true })
      .select('title mood createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const entries: PinnedEntryCard[] = rawEntries.map((e) => ({
      id: String(e._id),
      title: e.title,
      mood: e.mood,
      createdAt: e.createdAt.toISOString(),
    }))

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('[GET /api/journal/pinned] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
