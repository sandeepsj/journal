import mongoose from 'mongoose'
import { JournalChunk } from '@/lib/db/models/JournalChunk'
import { generateEmbedding } from './generate'
import { chunkText } from './chunk'

export async function storeChunksForEntry(
  entryId: string,
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  const entryObjId = new mongoose.Types.ObjectId(entryId)
  const userObjId  = new mongoose.Types.ObjectId(userId)

  // Prepend title to the first chunk so context is preserved
  const fullText = `${title}\n\n${body}`
  const chunks = chunkText(fullText)

  console.log(`[chunks] entryId=${entryId} splitting into ${chunks.length} chunks`)

  // Delete old chunks for this entry before re-storing
  await JournalChunk.deleteMany({ entryId: entryObjId })

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await generateEmbedding(chunks[i])
      await JournalChunk.create({
        entryId: entryObjId,
        userId: userObjId,
        chunkIndex: i,
        text: chunks[i],
        embedding,
      })
      console.log(`[chunks] stored chunk ${i + 1}/${chunks.length} entryId=${entryId}`)
    } catch (err) {
      console.error(`[chunks] failed chunk ${i} entryId=${entryId}:`, err)
    }
  }
}
