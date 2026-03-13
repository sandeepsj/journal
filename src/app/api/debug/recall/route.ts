import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { JournalChunk } from '@/lib/db/models/JournalChunk'
import mongoose from 'mongoose'

// GET /api/debug/recall — diagnostic info for recall pipeline
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  await connectDB()
  const userObjectId = new mongoose.Types.ObjectId(userId)

  const [entries, entriesWithEmbedding, totalChunks] = await Promise.all([
    JournalEntry.find({ userId: userObjectId }).select('_id title createdAt').lean(),
    JournalEntry.countDocuments({ userId: userObjectId, 'embedding.0': { $exists: true } }),
    JournalChunk.countDocuments({ userId: userObjectId }),
  ])

  const entryDetails = entries.map((e) => ({
    id: String(e._id),
    title: e.title,
    createdAt: e.createdAt,
  }))

  return NextResponse.json({
    userId,
    totalEntries: entries.length,
    entriesWithEmbedding,
    totalChunks,
    entries: entryDetails,
    diagnosis: totalChunks === 0
      ? '⚠️  No chunks found — run fetch("/api/admin/reembed", { method: "POST" }) in the browser console'
      : entriesWithEmbedding < entries.length
      ? '⚠️  Some entries missing embeddings — run reembed'
      : '✅ Looks good — check Atlas vector index if recall still fails',
  })
}
