import mongoose, { Schema, model, models } from 'mongoose'

export interface IJournalChunk {
  _id: mongoose.Types.ObjectId
  entryId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  chunkIndex: number
  text: string
  embedding: number[]  // 1024-dim from voyage-3
}

const JournalChunkSchema = new Schema<IJournalChunk>({
  entryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], default: [] },
})

JournalChunkSchema.index({ entryId: 1 })
JournalChunkSchema.index({ userId: 1 })

export const JournalChunk =
  models.JournalChunk ?? model<IJournalChunk>('JournalChunk', JournalChunkSchema)
