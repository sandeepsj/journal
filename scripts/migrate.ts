/**
 * One-time migration script: MongoDB → Google Drive
 *
 * Reads all journal entries from MongoDB and creates the multi-file
 * Drive structure (content.md + drawing.png + metadata.json) for each.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." \
 *   GOOGLE_ACCESS_TOKEN="ya29...." \
 *   MONGO_USER_ID="6xxxxxxxxxxxx" \
 *   npx tsx scripts/migrate.ts
 *
 * To get your Google access token:
 *   1. Open the Muse SPA in the browser
 *   2. Sign in with Google
 *   3. Open DevTools → Application → Session Storage
 *   4. Copy the value of 'access_token'
 *
 * To get your MongoDB user ID:
 *   Check MongoDB Atlas or the old app's database
 */

import { MongoClient, ObjectId } from 'mongodb'

// ── Config ────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN
const MONGO_USER_ID = process.env.MONGO_USER_ID

if (!MONGODB_URI || !GOOGLE_ACCESS_TOKEN || !MONGO_USER_ID) {
  console.error('Missing required environment variables:')
  if (!MONGODB_URI) console.error('  MONGODB_URI')
  if (!GOOGLE_ACCESS_TOKEN) console.error('  GOOGLE_ACCESS_TOKEN')
  if (!MONGO_USER_ID) console.error('  MONGO_USER_ID')
  console.error('\nUsage:')
  console.error('  MONGODB_URI="..." GOOGLE_ACCESS_TOKEN="..." MONGO_USER_ID="..." npx tsx scripts/migrate.ts')
  process.exit(1)
}

// ── Drive API helpers ─────────────────────────────────────────

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const APP_FOLDER_NAME = 'Muse Journal'

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Drive API ${res.status}: ${body}`)
  }
  return res
}

async function getOrCreateAppFolder(): Promise<string> {
  const q = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchRes = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`)
  const searchData = await searchRes.json()

  if (searchData.files?.length > 0) {
    return searchData.files[0].id
  }

  const createRes = await driveFetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  return (await createRes.json()).id
}

async function createDriveFolder(
  parentId: string,
  name: string,
  appProperties: Record<string, string>
): Promise<string> {
  const res = await driveFetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
      appProperties,
    }),
  })
  return (await res.json()).id
}

async function createTextFile(folderId: string, fileName: string, content: string): Promise<void> {
  const metadata = { name: fileName, parents: [folderId], mimeType: 'text/markdown' }
  const boundary = '---migrate-boundary'
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n` +
    `--${boundary}--`

  await driveFetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
}

async function createJsonFile(folderId: string, fileName: string, content: unknown): Promise<void> {
  const metadata = { name: fileName, parents: [folderId], mimeType: 'application/json' }
  const boundary = '---migrate-boundary'
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(content)}\r\n` +
    `--${boundary}--`

  await driveFetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
}

async function createPngFile(folderId: string, fileName: string, dataUrl: string): Promise<void> {
  // Decode base64 data URL to binary
  const base64 = dataUrl.split(',')[1]
  if (!base64) return
  const binary = Buffer.from(base64, 'base64')

  const metadata = { name: fileName, parents: [folderId], mimeType: 'image/png' }
  const metadataStr = JSON.stringify(metadata)

  const metaPart = `--migrate-boundary\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataStr}\r\n--migrate-boundary\r\nContent-Type: image/png\r\n\r\n`
  const endPart = `\r\n--migrate-boundary--`

  const metaBytes = Buffer.from(metaPart)
  const endBytes = Buffer.from(endPart)
  const combined = Buffer.concat([metaBytes, binary, endBytes])

  await driveFetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/related; boundary=migrate-boundary' },
    body: combined,
  })
}

// ── MongoDB types ─────────────────────────────────────────────

interface MongoJournalEntry {
  _id: ObjectId
  userId: ObjectId
  title: string
  body: string
  mood: string | null
  wordCount: number
  drawing: string | null
  textColor: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🔄 Muse Migration: MongoDB → Google Drive\n')

  // 1. Validate Google token
  console.log('Validating Google access token...')
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}` },
  })
  if (!userInfoRes.ok) {
    console.error('Invalid or expired Google access token. Get a fresh one from the app.')
    process.exit(1)
  }
  const userInfo = await userInfoRes.json()
  console.log(`  Authenticated as: ${userInfo.email}\n`)

  // 2. Connect to MongoDB
  console.log('Connecting to MongoDB...')
  const client = new MongoClient(MONGODB_URI!)
  await client.connect()

  const db = client.db('muse')
  console.log(`  Connected to database: muse\n`)

  // 3. Fetch entries
  console.log(`Fetching entries for user ${MONGO_USER_ID}...`)
  const entries = await db
    .collection<MongoJournalEntry>('journalentries')
    .find({ userId: new ObjectId(MONGO_USER_ID) })
    .sort({ createdAt: 1 })
    .toArray()

  console.log(`  Found ${entries.length} entries.\n`)

  if (entries.length === 0) {
    console.log('Nothing to migrate.')
    await client.close()
    return
  }

  // 4. Get or create Drive app folder
  console.log('Setting up Google Drive folder...')
  const appFolderId = await getOrCreateAppFolder()
  console.log(`  App folder ready: ${APP_FOLDER_NAME}\n`)

  // 5. Migrate each entry
  let migrated = 0
  let failed = 0
  const failures: Array<{ title: string; error: string }> = []

  for (const entry of entries) {
    const title = entry.title || 'Untitled'
    const folderName = title.trim().slice(0, 60)
    const createdAt = entry.createdAt ? new Date(entry.createdAt).toISOString() : new Date().toISOString()
    const updatedAt = entry.updatedAt ? new Date(entry.updatedAt).toISOString() : createdAt

    try {
      // Create folder with appProperties for listing
      // Drive limit: key + value must be ≤ 124 bytes each
      const appProperties: Record<string, string> = {
        title: title.slice(0, 100),         // key(5) + value ≤ 124
        mood: entry.mood ?? '',             // key(4) + value ≤ 124
        wordCount: String(entry.wordCount || 0),
        excerpt: (entry.body || '').slice(0, 100), // key(7) + value ≤ 124
        createdAt,                          // key(9) + 24 char ISO = 33
        pinned: String(entry.pinned ?? false),
      }

      const folderId = await createDriveFolder(appFolderId, folderName, appProperties)

      // Create content.md
      const heading = title.trim() ? `# ${title.trim()}\n\n` : ''
      const markdown = `${heading}${entry.body || ''}`
      await createTextFile(folderId, 'content.md', markdown)

      // Create metadata.json (no embedding — incompatible model)
      const metadata = {
        id: entry._id.toString(),
        mood: entry.mood,
        wordCount: entry.wordCount || 0,
        textColor: entry.textColor || '#2C2825',
        pinned: entry.pinned ?? false,
        createdAt,
        updatedAt,
        hasDrawing: !!entry.drawing,
      }
      await createJsonFile(folderId, 'metadata.json', metadata)

      // Create drawing.png if exists
      if (entry.drawing) {
        await createPngFile(folderId, 'drawing.png', entry.drawing)
      }

      migrated++
      console.log(`  [${migrated}/${entries.length}] ${title}${entry.drawing ? ' (+ drawing)' : ''}`)
    } catch (err) {
      failed++
      const errMsg = err instanceof Error ? err.message : String(err)
      failures.push({ title, error: errMsg })
      console.error(`  [FAILED] ${title}: ${errMsg}`)
    }
  }

  // 6. Summary
  console.log('\n--- Migration Complete ---')
  console.log(`  Migrated: ${migrated}/${entries.length}`)
  if (failed > 0) {
    console.log(`  Failed:   ${failed}`)
    console.log('\n  Failures:')
    for (const f of failures) {
      console.log(`    - ${f.title}: ${f.error}`)
    }
  }
  console.log('\nNext steps:')
  console.log('  1. Open the Muse SPA and verify entries appear')
  console.log('  2. To regenerate embeddings, open and save each entry')
  console.log('  3. Check Google Drive — your entries are in "Muse Journal/" as readable files')

  await client.close()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
