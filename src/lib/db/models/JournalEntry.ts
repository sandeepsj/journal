import mongoose, { Schema, model, models } from 'mongoose'

export type Mood = 'calm' | 'happy' | 'anxious' | 'sad' | 'grateful'

export interface IJournalEntry {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  body: string
  mood: Mood | null
  wordCount: number
  embedding: number[]  // 1024-dim from voyage-3
  drawing: string | null  // base64 PNG — presentation only, not indexed
  textColor: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 300 },
    body: { type: String, required: true },
    mood: {
      type: String,
      enum: ['calm', 'happy', 'anxious', 'sad', 'grateful', null],
      default: null,
    },
    wordCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    drawing: { type: String, default: null },
    textColor: { type: String, default: '#2C2825' },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Compound index for paginated user queries
JournalEntrySchema.index({ userId: 1, createdAt: -1 })

// Text index for keyword search
JournalEntrySchema.index({ title: 'text', body: 'text' })

export const JournalEntry =
  models.JournalEntry ?? model<IJournalEntry>('JournalEntry', JournalEntrySchema)
