import type { Mood } from '@/lib/db/models/JournalEntry'

export type { Mood }

export interface JournalEntryDTO {
  id: string
  userId: string
  title: string
  body: string
  mood: Mood | null
  wordCount: number
  drawing?: string | null
  textColor?: string
  createdAt: string
  updatedAt: string
}

// List item — without body/embedding for performance
export interface JournalEntryListItem {
  id: string
  title: string
  mood: Mood | null
  wordCount: number
  excerpt: string   // first 120 chars of body
  createdAt: string
  updatedAt: string
}

export interface RecallResult {
  answer: string
  citations: JournalEntryListItem[]
}
