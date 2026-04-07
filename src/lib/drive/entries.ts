import {
  getOrCreateAppFolder,
  createFolder,
  listFolders,
  findFileInFolder,
  readJsonFile,
  readTextFile,
  readFileAsDataUrl,
  createJsonFile,
  createTextFile,
  createBinaryFile,
  updateJsonFile,
  updateTextFile,
  updateBinaryFile,
  deleteFile,
} from './client'
import type { Mood } from '@/types/journal'

// ── File names inside each entry folder ───────────────────────
const CONTENT_FILE = 'content.md'
const DRAWING_FILE = 'drawing.png'
const METADATA_FILE = 'metadata.json'

// ── Types ─────────────────────────────────────────────────────

/** Metadata stored in metadata.json inside each entry folder */
export interface EntryMetadata {
  id: string
  mood: Mood | null
  wordCount: number
  textColor: string
  pinned: boolean
  createdAt: string
  updatedAt: string
  hasDrawing: boolean
  embedding?: number[]
}

/** Full entry as returned to the app */
export interface DriveJournalEntry {
  id: string           // Drive folder ID
  title: string
  body: string
  mood: Mood | null
  wordCount: number
  textColor: string
  drawing: string | null  // data URL
  pinned: boolean
  createdAt: string
  updatedAt: string
  embedding?: number[]
}

/** Lightweight list item from folder appProperties */
export interface DriveEntryListItem {
  id: string
  title: string
  mood: Mood | null
  wordCount: number
  excerpt: string
  createdAt: string
  updatedAt: string
  pinned: boolean
}

// ── Folder cache ──────────────────────────────────────────────

let cachedFolderId: string | null = null

async function getFolderId(token: string): Promise<string> {
  if (!cachedFolderId) {
    cachedFolderId = await getOrCreateAppFolder(token)
  }
  return cachedFolderId
}

export function resetFolderCache() {
  cachedFolderId = null
}

// ── Helpers ───────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function countWords(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

function makeExcerpt(body: string, maxLen = 120): string {
  return body.length > maxLen ? body.slice(0, maxLen) + '...' : body
}

/** Convert title + body into markdown content */
function toMarkdown(title: string, body: string): string {
  const heading = title.trim() ? `# ${title.trim()}\n\n` : ''
  return `${heading}${body}`
}

/** Parse markdown content back into title + body */
function fromMarkdown(content: string): { title: string; body: string } {
  const lines = content.split('\n')
  if (lines[0]?.startsWith('# ')) {
    const title = lines[0].slice(2).trim()
    // Skip the blank line after the heading
    const bodyStart = lines[1]?.trim() === '' ? 2 : 1
    const body = lines.slice(bodyStart).join('\n')
    return { title, body }
  }
  return { title: '', body: content }
}

// ── CRUD ──────────────────────────────────────────────────────

/**
 * List journal entries from Drive.
 * Uses appProperties on entry folders for metadata — no file downloads needed.
 */
export async function listEntries(
  token: string,
  options?: { search?: string; pageSize?: number; pageToken?: string }
): Promise<{ entries: DriveEntryListItem[]; nextPageToken?: string }> {
  const folderId = await getFolderId(token)
  const { files, nextPageToken } = await listFolders(
    token,
    folderId,
    options?.pageSize ?? 50,
    options?.pageToken
  )

  const entries: DriveEntryListItem[] = files.map((f) => ({
    id: f.id,
    title: f.appProperties?.title || f.name || 'Untitled',
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

/** Get a full journal entry by Drive folder ID */
export async function getEntry(
  token: string,
  folderId: string
): Promise<DriveJournalEntry> {
  // Find files inside the entry folder
  const contentFileId = await findFileInFolder(token, folderId, CONTENT_FILE)
  const metadataFileId = await findFileInFolder(token, folderId, METADATA_FILE)

  if (!contentFileId || !metadataFileId) {
    throw new Error('Entry is missing content or metadata files')
  }

  // Read content and metadata in parallel
  const [markdownContent, metadata] = await Promise.all([
    readTextFile(token, contentFileId),
    readJsonFile<EntryMetadata>(token, metadataFileId),
  ])

  const { title, body } = fromMarkdown(markdownContent)

  // Read drawing if it exists
  let drawing: string | null = null
  if (metadata.hasDrawing) {
    const drawingFileId = await findFileInFolder(token, folderId, DRAWING_FILE)
    if (drawingFileId) {
      drawing = await readFileAsDataUrl(token, drawingFileId, 'image/png')
    }
  }

  return {
    id: folderId,
    title,
    body,
    mood: metadata.mood,
    wordCount: metadata.wordCount,
    textColor: metadata.textColor,
    drawing,
    pinned: metadata.pinned,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    embedding: metadata.embedding,
  }
}

/** Create a new journal entry. Returns the Drive folder ID. */
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
  const rootFolderId = await getFolderId(token)
  const now = new Date().toISOString()
  const entryId = generateId()
  const folderName = data.title.trim()
    ? `${data.title.trim().slice(0, 60)}`
    : `Entry ${new Date().toLocaleDateString()}`

  // 1. Create entry folder with appProperties for listing
  const appProperties = {
    title: (data.title || 'Untitled').slice(0, 124),
    mood: data.mood ?? '',
    wordCount: String(countWords(data.body)),
    excerpt: makeExcerpt(data.body).slice(0, 124),
    createdAt: now,
    pinned: 'false',
  }

  // Create folder via Drive API with appProperties
  const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
      appProperties,
    }),
  })
  if (!folderRes.ok) throw new Error('Failed to create entry folder')
  const folderData = await folderRes.json()
  const folderId = folderData.id

  // 2. Create files inside the folder (in parallel)
  const metadata: EntryMetadata = {
    id: entryId,
    mood: data.mood,
    wordCount: countWords(data.body),
    textColor: data.textColor ?? '#2C2825',
    pinned: false,
    createdAt: now,
    updatedAt: now,
    hasDrawing: !!data.drawing,
  }

  const markdown = toMarkdown(data.title, data.body)
  const fileOps: Promise<unknown>[] = [
    createTextFile(token, folderId, CONTENT_FILE, markdown),
    createJsonFile(token, folderId, METADATA_FILE, metadata),
  ]

  if (data.drawing) {
    fileOps.push(createBinaryFile(token, folderId, DRAWING_FILE, data.drawing, 'image/png'))
  }

  await Promise.all(fileOps)

  const entry: DriveJournalEntry = {
    id: folderId,
    title: data.title,
    body: data.body,
    mood: data.mood,
    wordCount: metadata.wordCount,
    textColor: metadata.textColor,
    drawing: data.drawing ?? null,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  }

  return { id: folderId, entry }
}

/** Update an existing journal entry */
export async function updateEntry(
  token: string,
  folderId: string,
  data: {
    title: string
    body: string
    mood: Mood | null
    textColor?: string
    drawing?: string | null
  }
): Promise<DriveJournalEntry> {
  // Find existing files
  const [contentFileId, metadataFileId, drawingFileId] = await Promise.all([
    findFileInFolder(token, folderId, CONTENT_FILE),
    findFileInFolder(token, folderId, METADATA_FILE),
    findFileInFolder(token, folderId, DRAWING_FILE),
  ])

  if (!contentFileId || !metadataFileId) {
    throw new Error('Entry is missing content or metadata files')
  }

  // Read existing metadata to preserve fields
  const existing = await readJsonFile<EntryMetadata>(token, metadataFileId)
  const now = new Date().toISOString()

  const updatedMetadata: EntryMetadata = {
    ...existing,
    mood: data.mood,
    wordCount: countWords(data.body),
    textColor: data.textColor ?? existing.textColor,
    updatedAt: now,
    hasDrawing: !!data.drawing,
  }

  // Update appProperties on the folder for listing
  const appProperties = {
    title: (data.title || 'Untitled').slice(0, 124),
    mood: data.mood ?? '',
    wordCount: String(updatedMetadata.wordCount),
    excerpt: makeExcerpt(data.body).slice(0, 124),
    createdAt: existing.createdAt,
    pinned: String(existing.pinned),
  }

  // Update folder name + appProperties
  await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.title.trim() ? data.title.trim().slice(0, 60) : `Entry ${new Date().toLocaleDateString()}`,
      appProperties,
    }),
  })

  // Update files in parallel
  const markdown = toMarkdown(data.title, data.body)
  const fileOps: Promise<unknown>[] = [
    updateTextFile(token, contentFileId, markdown),
    updateJsonFile(token, metadataFileId, updatedMetadata),
  ]

  // Handle drawing: create, update, or delete
  if (data.drawing && drawingFileId) {
    fileOps.push(updateBinaryFile(token, drawingFileId, data.drawing, 'image/png'))
  } else if (data.drawing && !drawingFileId) {
    fileOps.push(createBinaryFile(token, folderId, DRAWING_FILE, data.drawing, 'image/png'))
  } else if (!data.drawing && drawingFileId) {
    fileOps.push(deleteFile(token, drawingFileId))
  }

  await Promise.all(fileOps)

  return {
    id: folderId,
    title: data.title,
    body: data.body,
    mood: data.mood,
    wordCount: updatedMetadata.wordCount,
    textColor: updatedMetadata.textColor,
    drawing: data.drawing ?? null,
    pinned: existing.pinned,
    createdAt: existing.createdAt,
    updatedAt: now,
    embedding: existing.embedding,
  }
}

/** Toggle pin status on an entry */
export async function togglePin(
  token: string,
  folderId: string,
  pinned: boolean
): Promise<void> {
  const metadataFileId = await findFileInFolder(token, folderId, METADATA_FILE)
  if (!metadataFileId) throw new Error('Metadata file not found')

  const existing = await readJsonFile<EntryMetadata>(token, metadataFileId)
  const updated = { ...existing, pinned, updatedAt: new Date().toISOString() }

  // Update metadata file
  await updateJsonFile(token, metadataFileId, updated)

  // Update folder appProperties
  await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appProperties: { pinned: String(pinned) },
    }),
  })
}

/** Delete a journal entry (deletes the entire folder) */
export async function deleteEntry(
  token: string,
  folderId: string
): Promise<void> {
  await deleteFile(token, folderId)
}

/** Get all pinned entries */
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
  const rootFolderId = await getFolderId(token)
  const results: Array<{ fileId: string; title: string; body: string; embedding: number[] }> = []
  let pageToken: string | undefined

  do {
    const { files: folders, nextPageToken } = await listFolders(token, rootFolderId, 100, pageToken)

    const entries = await Promise.all(
      folders.map(async (folder) => {
        try {
          const [contentFileId, metadataFileId] = await Promise.all([
            findFileInFolder(token, folder.id, CONTENT_FILE),
            findFileInFolder(token, folder.id, METADATA_FILE),
          ])
          if (!contentFileId || !metadataFileId) return null

          const [markdown, metadata] = await Promise.all([
            readTextFile(token, contentFileId),
            readJsonFile<EntryMetadata>(token, metadataFileId),
          ])

          if (metadata.embedding && metadata.embedding.length > 0) {
            const { title, body } = fromMarkdown(markdown)
            return { fileId: folder.id, title, body, embedding: metadata.embedding }
          }
        } catch { /* skip unreadable entries */ }
        return null
      })
    )

    results.push(...entries.filter((e): e is NonNullable<typeof e> => e !== null))
    pageToken = nextPageToken
  } while (pageToken)

  return results
}
