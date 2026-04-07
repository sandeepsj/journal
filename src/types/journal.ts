export type Mood = 'calm' | 'happy' | 'anxious' | 'sad' | 'grateful'

export interface JournalEntry {
  id: string
  title: string
  body: string
  bodyPlainText: string
  mood: Mood | null
  wordCount: number
  textColor?: string
  drawing?: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
  embedding?: number[]
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
  pinned: boolean
}

export interface PinnedEntryCard {
  id: string
  title: string
  mood: Mood | null
  createdAt: string
}

export interface RecallResult {
  answer: string
  citations: JournalEntryListItem[]
}
