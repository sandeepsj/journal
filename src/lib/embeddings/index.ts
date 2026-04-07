import { readFile, updateFile } from '@/lib/drive/client'
import type { DriveJournalEntry } from '@/lib/drive/entries'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Call the Vercel proxy to generate an embedding, then update the
 * Drive file with the embedding field.
 *
 * Designed to be called fire-and-forget after save.
 */
export async function generateAndStoreEmbedding(
  accessToken: string,
  fileId: string,
  text: string
): Promise<void> {
  if (!API_BASE || !text.trim()) return

  // 1. Generate embedding via Vercel proxy
  const embedRes = await fetch(`${API_BASE}/api/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  })

  if (!embedRes.ok) {
    throw new Error(`Embedding API error: ${embedRes.status}`)
  }

  const { embedding } = await embedRes.json()
  if (!embedding || !Array.isArray(embedding)) return

  // 2. Read current file, add embedding, write back
  const entry = await readFile<DriveJournalEntry>(accessToken, fileId)
  const updated = { ...entry, embedding }

  await updateFile(accessToken, fileId, updated, {
    title: entry.title.slice(0, 124),
    mood: entry.mood ?? '',
    wordCount: String(entry.wordCount),
    excerpt: (entry.bodyPlainText || '').slice(0, 124),
    createdAt: entry.createdAt,
    pinned: String(entry.pinned),
  })
}
