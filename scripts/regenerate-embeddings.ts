/**
 * Regenerate embeddings for all journal entries in Google Drive.
 *
 * Reads each entry's content.md, calls the centralized LLM proxy,
 * and stores the embedding in metadata.json.
 *
 * Usage:
 *   GOOGLE_ACCESS_TOKEN="ya29...." \
 *   npx tsx scripts/regenerate-embeddings.ts
 */

const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN
const PROXY_URL = 'https://llm-proxy-smoky.vercel.app/api/proxy'

if (!GOOGLE_ACCESS_TOKEN) {
  console.error('Missing required environment variable: GOOGLE_ACCESS_TOKEN')
  console.error('\nUsage:')
  console.error('  GOOGLE_ACCESS_TOKEN="..." npx tsx scripts/regenerate-embeddings.ts')
  process.exit(1)
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const APP_FOLDER_NAME = 'Muse Journal'

async function driveFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}`, ...init?.headers },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`)
  return res
}

async function findAppFolder(): Promise<string> {
  const q = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`)
  const data = await res.json()
  if (!data.files?.length) throw new Error('Muse Journal folder not found in Drive')
  return data.files[0].id
}

async function listFolders(parentId: string): Promise<Array<{ id: string; name: string }>> {
  const folders: Array<{ id: string; name: string }> = []
  let pageToken: string | undefined
  do {
    const q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    let url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name),nextPageToken&pageSize=100`
    if (pageToken) url += `&pageToken=${pageToken}`
    const res = await driveFetch(url)
    const data = await res.json()
    folders.push(...(data.files || []))
    pageToken = data.nextPageToken
  } while (pageToken)
  return folders
}

async function findFile(folderId: string, fileName: string): Promise<string | null> {
  const q = `'${folderId}' in parents and name='${fileName}' and trashed=false`
  const res = await driveFetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`)
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

async function readText(fileId: string): Promise<string> {
  const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`)
  return res.text()
}

async function readJson<T>(fileId: string): Promise<T> {
  const res = await driveFetch(`${DRIVE_API}/files/${fileId}?alt=media`)
  return res.json()
}

async function updateJson(fileId: string, content: unknown): Promise<void> {
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  })
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GOOGLE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      provider: 'google',
      endpoint: 'models/gemini-embedding-001:embedContent',
      body: { content: { parts: [{ text }] } },
    }),
  })
  if (!res.ok) throw new Error(`Proxy ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.embedding?.values
}

async function main() {
  console.log('Regenerating embeddings for all journal entries...\n')

  const appFolderId = await findAppFolder()
  const folders = await listFolders(appFolderId)
  console.log(`Found ${folders.length} entries.\n`)

  let done = 0
  let skipped = 0
  let failed = 0

  for (const folder of folders) {
    try {
      const [contentId, metadataId] = await Promise.all([
        findFile(folder.id, 'content.md'),
        findFile(folder.id, 'metadata.json'),
      ])

      if (!contentId || !metadataId) {
        console.log(`  [SKIP] ${folder.name} — missing files`)
        skipped++
        continue
      }

      const metadata = await readJson<Record<string, unknown>>(metadataId)
      if (Array.isArray(metadata.embedding) && metadata.embedding.length > 0) {
        console.log(`  [SKIP] ${folder.name} — already has embedding`)
        skipped++
        continue
      }

      const content = await readText(contentId)
      const embedding = await getEmbedding(content)

      metadata.embedding = embedding
      await updateJson(metadataId, metadata)

      done++
      console.log(`  [${done}/${folders.length}] ${folder.name}`)
    } catch (err) {
      failed++
      console.error(`  [FAILED] ${folder.name}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('\n--- Done ---')
  console.log(`  Generated: ${done}`)
  console.log(`  Skipped:   ${skipped}`)
  if (failed) console.log(`  Failed:    ${failed}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
