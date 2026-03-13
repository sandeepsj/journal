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

  const [entries, totalChunks, sampleChunk] = await Promise.all([
    JournalEntry.find({ userId: userObjectId }).select('_id title createdAt').lean(),
    JournalChunk.countDocuments({ userId: userObjectId }),
    JournalChunk.findOne({ userId: userObjectId }).select('embedding chunkIndex text').lean(),
  ])

  const chunkEmbeddingDims = sampleChunk?.embedding?.length ?? 0

  // Try a real vector search to detect missing Atlas index
  let vectorSearchWorks = false
  let vectorSearchError = ''
  if (sampleChunk?.embedding?.length) {
    try {
      const testResults = await JournalChunk.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: sampleChunk.embedding,
            numCandidates: 10,
            limit: 1,
            filter: { userId: userObjectId },
          },
        },
        { $project: { _id: 1 } },
      ])
      vectorSearchWorks = testResults.length >= 0  // even 0 results means index exists
    } catch (err) {
      vectorSearchError = err instanceof Error ? err.message : String(err)
    }
  }

  let diagnosis = ''
  if (totalChunks === 0) {
    diagnosis = '⚠️  No chunks — run: fetch("/api/admin/reembed", { method: "POST" }).then(r=>r.json()).then(console.log)'
  } else if (chunkEmbeddingDims === 0) {
    diagnosis = '⚠️  Chunks exist but have no embeddings — run reembed'
  } else if (vectorSearchError) {
    diagnosis = `❌ Atlas Vector Search index missing or broken on "journalchunks". Error: ${vectorSearchError}. Create index named "vector_index" with ${chunkEmbeddingDims} dims on journalchunks collection.`
  } else {
    diagnosis = '✅ Chunks + embeddings + Atlas index all look good'
  }

  return NextResponse.json({
    userId,
    totalEntries: entries.length,
    totalChunks,
    chunkEmbeddingDims,
    vectorSearchWorks,
    vectorSearchError: vectorSearchError || null,
    diagnosis,
    sampleChunkText: sampleChunk?.text?.slice(0, 100) ?? null,
  })
}
