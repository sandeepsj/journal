import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { updateJournalSchema } from '@/lib/validations/journal'
import { storeChunksForEntry } from '@/lib/embeddings/storeChunks'
import { generateEmbedding } from '@/lib/embeddings/generate'
import { JournalChunk } from '@/lib/db/models/JournalChunk'

type Params = { params: Promise<{ id: string }> }

// GET /api/journal/[id]
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  console.log(`[GET /api/journal/${id}] userId=${session.user.id}`)

  try {
    await connectDB()

    const entry = await JournalEntry.findOne({ _id: id, userId: session.user.id })
      .select('-embedding')
      .lean()

    if (!entry) {
      console.warn(`[GET /api/journal/${id}] not found for userId=${session.user.id}`)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: String(entry._id),
      title: entry.title,
      body: entry.body,
      mood: entry.mood,
      wordCount: entry.wordCount,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })
  } catch (err) {
    console.error(`[GET /api/journal/${id}] error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/journal/[id]
export async function PUT(request: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  console.log(`[PUT /api/journal/${id}] userId=${session.user.id}`)

  try {
    const body = await request.json()
    const parsed = updateJournalSchema.safeParse(body)
    if (!parsed.success) {
      console.warn(`[PUT /api/journal/${id}] validation failed:`, parsed.error.flatten())
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await connectDB()

    const existing = await JournalEntry.findOne({ _id: id, userId: session.user.id })
    if (!existing) {
      console.warn(`[PUT /api/journal/${id}] not found for userId=${session.user.id}`)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updates = parsed.data
    if (updates.body !== undefined) {
      const wordCount = updates.body.trim().split(/\s+/).filter(Boolean).length
      Object.assign(updates, { wordCount })
    }

    await JournalEntry.findByIdAndUpdate(id, updates)
    console.log(`[PUT /api/journal/${id}] updated fields: ${Object.keys(updates).join(', ')}`)

    // Re-chunk and re-embed if content changed
    if (updates.title !== undefined || updates.body !== undefined) {
      const title = updates.title ?? existing.title
      const entryBody = updates.body ?? existing.body
      storeChunksForEntry(id, session.user.id, title, entryBody)
        .catch((err) => console.error('[chunks] re-store failed for', id, err))
      generateEmbedding(`${title}\n\n${entryBody}`)
        .then((emb) => JournalEntry.updateOne({ _id: id }, { embedding: emb }))
        .catch(() => {})
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error(`[PUT /api/journal/${id}] error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/journal/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  console.log(`[DELETE /api/journal/${id}] userId=${session.user.id}`)

  try {
    await connectDB()

    const result = await JournalEntry.findOneAndDelete({ _id: id, userId: session.user.id })
    if (!result) {
      console.warn(`[DELETE /api/journal/${id}] not found for userId=${session.user.id}`)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Clean up chunks
    await JournalChunk.deleteMany({ entryId: id })
    console.log(`[DELETE /api/journal/${id}] deleted entry + chunks`)
    return NextResponse.json({ id })
  } catch (err) {
    console.error(`[DELETE /api/journal/${id}] error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
