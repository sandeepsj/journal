import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { generateEmbedding, buildEmbeddingInput } from '@/lib/embeddings/generate'

// POST /api/admin/reembed — re-embed all entries for the current user that have empty embeddings
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  console.log(`[reembed] start userId=${userId}`)

  await connectDB()

  // Find entries with missing or empty embeddings
  const entries = await JournalEntry.find({
    userId,
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  }).select('_id title body')

  console.log(`[reembed] found ${entries.length} entries needing re-embedding`)

  if (entries.length === 0) {
    return NextResponse.json({ message: 'All entries already have embeddings', count: 0 })
  }

  const results: { id: string; status: 'ok' | 'error'; error?: string }[] = []

  for (const entry of entries) {
    const id = String(entry._id)
    try {
      const embedding = await generateEmbedding(buildEmbeddingInput(entry.title, entry.body))
      await JournalEntry.findByIdAndUpdate(id, { embedding })
      console.log(`[reembed] ✓ ${id} dims=${embedding.length}`)
      results.push({ id, status: 'ok' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[reembed] ✗ ${id}:`, msg)
      results.push({ id, status: 'error', error: msg })
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length
  console.log(`[reembed] done ok=${ok} failed=${failed}`)

  return NextResponse.json({ ok, failed, results })
}
