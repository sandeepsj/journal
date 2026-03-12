import mongoose, { Schema, model, models } from 'mongoose'

export type ChatRole = 'user' | 'assistant'

export interface ICitation {
  id: string
  title: string
  excerpt: string
  createdAt: string
  mood: string | null
}

export interface IChatMessage {
  role: ChatRole
  content: string
  citations?: ICitation[]
  createdAt: Date
}

export interface IChatSession {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  messages: IChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const CitationSchema = new Schema<ICitation>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    createdAt: { type: String, required: true },
    mood: { type: String, default: null },
  },
  { _id: false }
)

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: undefined },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
)

// When we stream, we will push messages to this array
const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'New Chat' },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true }
)

// Index for fetching a user's sessions ordered by recent activity
ChatSessionSchema.index({ userId: 1, updatedAt: -1 })

export const ChatSession =
  models.ChatSession ?? model<IChatSession>('ChatSession', ChatSessionSchema)
