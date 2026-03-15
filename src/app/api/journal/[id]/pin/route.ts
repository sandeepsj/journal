import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { patchPinSchema } from '@/lib/validations/journal'

const PIN_LIMIT = 10

type Params = { params: Promise<{ id: string }> }

// PATCH /api/journal/[id]/pin — toggle pinned flag
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = patchPinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { pinned } = parsed.data

    await connectDB()

    // Cap check — only when pinning
    if (pinned) {
      const count = await JournalEntry.countDocuments({ userId: session.user.id, pinned: true })
      if (count >= PIN_LIMIT) {
        return NextResponse.json({ error: 'PIN_LIMIT_REACHED' }, { status: 422 })
      }
    }

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { pinned },
      { new: true }
    ).select('_id pinned')

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ id: String(entry._id), pinned: entry.pinned })
  } catch (err) {
    console.error(`[PATCH /api/journal/${id}/pin] error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
