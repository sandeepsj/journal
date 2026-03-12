import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { createJournalSchema } from '@/lib/validations/journal'
import { generateEmbedding, buildEmbeddingInput } from '@/lib/embeddings/generate'
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

  await connectDB()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { userId: session.user.id }
  if (search) filter.$text = { $search: search }

  const [rawEntries, total] = await Promise.all([
    JournalEntry.find(filter)
      .select('title mood wordCount body createdAt updatedAt')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    JournalEntry.countDocuments(filter),
  ])

  const entries: JournalEntryListItem[] = rawEntries.map((e) => ({
    id: String(e._id),
    title: e.title,
    mood: e.mood,
    wordCount: e.wordCount,
    excerpt: (e.body ?? '').slice(0, 120),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }))

  return NextResponse.json({
    entries,
    pagination: { page, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) },
  })
}

// POST /api/journal — create entry and generate embedding async
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createJournalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title: rawTitle, body: entryBody, mood } = parsed.data
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
    embedding: [],
  })

  const entryId = String(entry._id)
  generateEmbedding(buildEmbeddingInput(title, entryBody))
    .then((embedding) => JournalEntry.findByIdAndUpdate(entryId, { embedding }))
    .catch((err) => console.error('[embedding] failed for', entryId, err))

  return NextResponse.json({ id: entryId }, { status: 201 })
}
