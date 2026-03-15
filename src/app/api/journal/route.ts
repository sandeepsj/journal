import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { createJournalSchema } from '@/lib/validations/journal'
import { storeChunksForEntry } from '@/lib/embeddings/storeChunks'
import { generateEmbedding } from '@/lib/embeddings/generate'
import type { JournalEntryListItem } from '@/types/journal'
import type { IJournalEntry } from '@/lib/db/models/JournalEntry'

const PAGE_SIZE = 20

// GET /api/journal — list entries for current user (paginated + optional text search)
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('search')?.trim() ?? ''
  const skip = (page - 1) * PAGE_SIZE

  console.log(`[GET /api/journal] userId=${session.user.id} page=${page} search="${search}"`)

  try {
    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { userId: session.user.id }
    if (search) filter.$text = { $search: search }

    const [rawEntries, total] = await Promise.all([
      JournalEntry.find(filter)
        .select('title mood wordCount body createdAt updatedAt pinned')
        .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      JournalEntry.countDocuments(filter),
    ])

    console.log(`[GET /api/journal] found ${rawEntries.length} entries (total=${total})`)

    const entries: JournalEntryListItem[] = rawEntries.map((e) => ({
      id: String(e._id),
      title: e.title,
      mood: e.mood,
      wordCount: e.wordCount,
      excerpt: (e.body ?? '').slice(0, 120),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      pinned: e.pinned ?? false,
    }))

    return NextResponse.json({
      entries,
      pagination: { page, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) },
    })
  } catch (err) {
    console.error('[GET /api/journal] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/journal — create entry and generate embedding async
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  console.log(`[POST /api/journal] userId=${session.user.id}`)

  try {
    const body = await request.json()
    const parsed = createJournalSchema.safeParse(body)
    if (!parsed.success) {
      console.warn('[POST /api/journal] validation failed:', parsed.error.flatten())
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { title: rawTitle, body: entryBody, mood, textColor, drawing } = parsed.data
    const title = rawTitle?.trim() ||
      new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const wordCount = entryBody.trim().split(/\s+/).filter(Boolean).length

    await connectDB()

    const entry = await JournalEntry.create({
      userId: session.user.id,
      title,
      body: entryBody,
      mood: mood ?? null,
      wordCount,
      ...(textColor !== undefined && { textColor }),
      ...(drawing !== undefined && { drawing }),
    })

    const entryId = String(entry._id)
    console.log(`[POST /api/journal] created entryId=${entryId} title="${title}" wordCount=${wordCount}`)

    // Store chunks async — non-blocking
    storeChunksForEntry(entryId, session.user.id, title, entryBody)
      .catch((err) => console.error('[chunks] async store failed for', entryId, err))

    // Save entry-level embedding async — best-effort fallback for recall
    generateEmbedding(`${title}\n\n${entryBody}`)
      .then((emb) => JournalEntry.updateOne({ _id: entry._id }, { embedding: emb }))
      .catch(() => {})

    return NextResponse.json({ id: entryId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/journal] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
