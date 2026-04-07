import { findFileInFolder, readJsonFile, updateJsonFile } from '@/lib/drive/client'
import { llmProxy } from '@/lib/llm-proxy'
import type { EntryMetadata } from '@/lib/drive/entries'

/**
 * Generate an embedding via the centralized LLM proxy, then update the
 * metadata.json file inside the entry folder with the embedding.
 *
 * Designed to be called fire-and-forget after save.
 */
export async function generateAndStoreEmbedding(
  accessToken: string,
  folderId: string,
  text: string
): Promise<void> {
  if (!text.trim()) return

  // 1. Generate embedding via centralized proxy (Gemini)
  const res = await llmProxy(
    'google',
    'models/gemini-embedding-001:embedContent',
    { content: { parts: [{ text }] } },
    accessToken
  )

  const data = await res.json()
  const embedding = data.embedding?.values
  if (!embedding || !Array.isArray(embedding)) return

  // 2. Find and update metadata.json with the embedding
  const metadataFileId = await findFileInFolder(accessToken, folderId, 'metadata.json')
  if (!metadataFileId) return

  const metadata = await readJsonFile<EntryMetadata>(accessToken, metadataFileId)
  const updated = { ...metadata, embedding }

  await updateJsonFile(accessToken, metadataFileId, updated)
}
