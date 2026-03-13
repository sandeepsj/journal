import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { storeChunksForEntry } from '@/lib/embeddings/storeChunks'
import { generateEmbedding } from '@/lib/embeddings/generate'

// POST /api/admin/reembed — re-chunk and re-embed all entries for the current user
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  console.log(`[reembed] start userId=${userId}`)

  await connectDB()

  const entries = await JournalEntry.find({ userId }).select('_id title body')
  console.log(`[reembed] found ${entries.length} entries`)

  if (entries.length === 0) {
    return NextResponse.json({ message: 'No entries found', count: 0 })
  }

  const results: { id: string; status: 'ok' | 'error'; error?: string }[] = []

  for (const entry of entries) {
    const id = String(entry._id)
    try {
      await storeChunksForEntry(id, userId, entry.title, entry.body)
      const emb = await generateEmbedding(`${entry.title}\n\n${entry.body}`)
      await JournalEntry.updateOne({ _id: entry._id }, { embedding: emb })
      console.log(`[reembed] ✓ ${id}`)
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
