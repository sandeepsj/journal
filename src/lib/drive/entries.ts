import {
  getOrCreateAppFolder,
  listFiles,
  readFile,
  createFile,
  updateFile,
  deleteFile,
} from './client'
import type { Mood } from '@/types/journal'

/** Shape of a journal entry stored in Google Drive */
export interface DriveJournalEntry {
  id: string
  title: string
  body: string
  bodyPlainText: string
  mood: Mood | null
  wordCount: number
  textColor: string
  drawing: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
  embedding?: number[]
}

/** Lightweight list item derived from Drive file metadata + appProperties */
export interface DriveEntryListItem {
  id: string            // Drive file ID
  title: string
  mood: Mood | null
  wordCount: number
  excerpt: string
  createdAt: string
  updatedAt: string
  pinned: boolean
}

// Cache the folder ID for the session
let cachedFolderId: string | null = null

async function getFolderId(token: string): Promise<string> {
  if (!cachedFolderId) {
    cachedFolderId = await getOrCreateAppFolder(token)
  }
  return cachedFolderId
}

/** Reset cached folder ID (e.g., on sign out) */
export function resetFolderCache() {
  cachedFolderId = null
}

function generateId(): string {
  return crypto.randomUUID()
}

function stripHtml(html: string): string {
  // Simple strip for plain text extraction
  return html.replace(/<[^>]*>/g, '').trim()
}

function makeExcerpt(body: string, maxLen = 120): string {
  const plain = stripHtml(body)
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain
}

function countWords(text: string): number {
  const plain = stripHtml(text)
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

/**
 * List journal entries from Drive.
 * Uses appProperties for metadata to avoid downloading full file content.
 */
export async function listEntries(
  token: string,
  options?: { search?: string; pageSize?: number; pageToken?: string }
): Promise<{ entries: DriveEntryListItem[]; nextPageToken?: string }> {
  const folderId = await getFolderId(token)
  const { files, nextPageToken } = await listFiles(
    token,
    folderId,
    options?.pageSize ?? 50,
    options?.pageToken
  )

  const entries: DriveEntryListItem[] = files.map((f) => ({
    id: f.id,
    title: f.appProperties?.title || 'Untitled',
    mood: (f.appProperties?.mood as Mood) || null,
    wordCount: parseInt(f.appProperties?.wordCount || '0', 10),
    excerpt: f.appProperties?.excerpt || '',
    createdAt: f.appProperties?.createdAt || f.modifiedTime,
    updatedAt: f.modifiedTime,
    pinned: f.appProperties?.pinned === 'true',
  }))

  // Client-side search filter
  if (options?.search) {
    const q = options.search.toLowerCase()
    return {
      entries: entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q)
      ),
      nextPageToken,
    }
  }

  return { entries, nextPageToken }
}

/** Get a full journal entry by Drive file ID */
export async function getEntry(
  token: string,
  fileId: string
): Promise<DriveJournalEntry> {
  return readFile<DriveJournalEntry>(token, fileId)
}

/** Create a new journal entry. Returns the Drive file ID. */
export async function createEntry(
  token: string,
  data: {
    title: string
    body: string
    mood: Mood | null
    textColor?: string
    drawing?: string | null
  }
): Promise<{ id: string; entry: DriveJournalEntry }> {
  const folderId = await getFolderId(token)
  const now = new Date().toISOString()
  const entryId = generateId()

  const entry: DriveJournalEntry = {
    id: entryId,
    title: data.title,
    body: data.body,
    bodyPlainText: stripHtml(data.body),
    mood: data.mood,
    wordCount: countWords(data.body),
    textColor: data.textColor ?? '#2C2825',
    drawing: data.drawing ?? null,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }

  const appProperties = {
    title: entry.title.slice(0, 124), // Drive limit: 124 bytes per value
    mood: entry.mood ?? '',
    wordCount: String(entry.wordCount),
    excerpt: makeExcerpt(entry.body).slice(0, 124),
    createdAt: now,
    pinned: 'false',
  }

  const fileId = await createFile(
    token,
    folderId,
    `${entryId}.json`,
    entry,
    appProperties
  )

  return { id: fileId, entry }
}

/** Update an existing journal entry */
export async function updateEntry(
  token: string,
  fileId: string,
  data: {
    title: string
    body: string
    mood: Mood | null
    textColor?: string
    drawing?: string | null
  }
): Promise<DriveJournalEntry> {
  // Read existing to preserve fields like createdAt, pinned, embedding
  const existing = await readFile<DriveJournalEntry>(token, fileId)

  const updated: DriveJournalEntry = {
    ...existing,
    title: data.title,
    body: data.body,
    bodyPlainText: stripHtml(data.body),
    mood: data.mood,
    wordCount: countWords(data.body),
    textColor: data.textColor ?? existing.textColor,
    drawing: data.drawing ?? null,
    updatedAt: new Date().toISOString(),
  }

  const appProperties = {
    title: updated.title.slice(0, 124),
    mood: updated.mood ?? '',
    wordCount: String(updated.wordCount),
    excerpt: makeExcerpt(updated.body).slice(0, 124),
    createdAt: updated.createdAt,
    pinned: String(updated.pinned),
  }

  await updateFile(token, fileId, updated, appProperties)

  return updated
}

/** Toggle pin status on an entry */
export async function togglePin(
  token: string,
  fileId: string,
  pinned: boolean
): Promise<void> {
  const existing = await readFile<DriveJournalEntry>(token, fileId)
  const updated = { ...existing, pinned, updatedAt: new Date().toISOString() }

  await updateFile(token, fileId, updated, {
    title: updated.title.slice(0, 124),
    mood: updated.mood ?? '',
    wordCount: String(updated.wordCount),
    excerpt: makeExcerpt(updated.body).slice(0, 124),
    createdAt: updated.createdAt,
    pinned: String(pinned),
  })
}

/** Delete a journal entry */
export async function deleteEntry(
  token: string,
  fileId: string
): Promise<void> {
  await deleteFile(token, fileId)
}

/** Get all pinned entries (list items) */
export async function listPinnedEntries(
  token: string
): Promise<DriveEntryListItem[]> {
  const { entries } = await listEntries(token, { pageSize: 100 })
  return entries.filter((e) => e.pinned)
}

/** Load all entries that have embeddings (for vector search) */
export async function loadAllEmbeddings(
  token: string
): Promise<Array<{ fileId: string; title: string; body: string; embedding: number[] }>> {
  const folderId = await getFolderId(token)
  const results: Array<{ fileId: string; title: string; body: string; embedding: number[] }> = []
  let pageToken: string | undefined

  // Paginate through all files
  do {
    const { files, nextPageToken } = await listFiles(token, folderId, 100, pageToken)
    // Read each file to get embedding — batch with Promise.all for speed
    const entries = await Promise.all(
      files.map(async (f) => {
        try {
          const entry = await readFile<DriveJournalEntry>(token, f.id)
          if (entry.embedding && entry.embedding.length > 0) {
            return { fileId: f.id, title: entry.title, body: entry.body, embedding: entry.embedding }
          }
        } catch { /* skip unreadable files */ }
        return null
      })
    )
    results.push(...entries.filter((e): e is NonNullable<typeof e> => e !== null))
    pageToken = nextPageToken
  } while (pageToken)

  return results
}
