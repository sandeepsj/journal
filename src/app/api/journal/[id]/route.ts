import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { updateJournalSchema } from '@/lib/validations/journal'
import { generateEmbedding, buildEmbeddingInput } from '@/lib/embeddings/generate'

type Params = { params: Promise<{ id: string }> }

// GET /api/journal/[id]
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()

  const entry = await JournalEntry.findOne({ _id: id, userId: session.user.id })
    .select('-embedding')
    .lean()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: String(entry._id),
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    wordCount: entry.wordCount,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  })
}

// PUT /api/journal/[id]
export async function PUT(request: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = updateJournalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await connectDB()

  const existing = await JournalEntry.findOne({ _id: id, userId: session.user.id })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates = parsed.data
  if (updates.body !== undefined) {
    updates.body = updates.body
    const wordCount = updates.body.trim().split(/\s+/).filter(Boolean).length
    Object.assign(updates, { wordCount })
  }

  await JournalEntry.findByIdAndUpdate(id, updates)

  // Re-embed if content changed
  if (updates.title !== undefined || updates.body !== undefined) {
    const title = updates.title ?? existing.title
    const entryBody = updates.body ?? existing.body
    generateEmbedding(buildEmbeddingInput(title, entryBody))
      .then((embedding) => JournalEntry.findByIdAndUpdate(id, { embedding }))
      .catch((err) => console.error('[embedding] re-embed failed for', id, err))
  }

  return NextResponse.json({ id })
}

// DELETE /api/journal/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()

  const result = await JournalEntry.findOneAndDelete({ _id: id, userId: session.user.id })
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ id })
}
