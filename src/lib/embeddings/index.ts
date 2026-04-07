import { findFileInFolder, readJsonFile, updateJsonFile } from '@/lib/drive/client'
import type { EntryMetadata } from '@/lib/drive/entries'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Call the Vercel proxy to generate an embedding, then update the
 * metadata.json file inside the entry folder with the embedding.
 *
 * Designed to be called fire-and-forget after save.
 */
export async function generateAndStoreEmbedding(
  accessToken: string,
  folderId: string,
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

  // 2. Find and update metadata.json with the embedding
  const metadataFileId = await findFileInFolder(accessToken, folderId, 'metadata.json')
  if (!metadataFileId) return

  const metadata = await readJsonFile<EntryMetadata>(accessToken, metadataFileId)
  const updated = { ...metadata, embedding }

  await updateJsonFile(accessToken, metadataFileId, updated)
}
