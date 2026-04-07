const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// App folder name in the user's Drive
const APP_FOLDER_NAME = 'Muse Journal'

export class DriveApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'DriveApiError'
  }
}

/** Authenticated fetch wrapper for Drive API */
async function driveFetch(
  url: string,
  token: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new DriveApiError(
      `Drive API ${res.status}: ${res.statusText}`,
      res.status
    )
  }

  return res
}

// ── Folder operations ─────────────────────────────────────────

/** Find or create the root app folder. Returns folder ID. */
export async function getOrCreateAppFolder(token: string): Promise<string> {
  const q = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`

  const searchRes = await driveFetch(searchUrl, token)
  const searchData = await searchRes.json()

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }

  const createRes = await driveFetch(`${DRIVE_API}/files`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const createData = await createRes.json()
  return createData.id
}

/** Create a subfolder inside a parent folder. Returns folder ID. */
export async function createFolder(
  token: string,
  parentId: string,
  name: string
): Promise<string> {
  const res = await driveFetch(`${DRIVE_API}/files`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  const data = await res.json()
  return data.id
}

// ── List operations ───────────────────────────────────────────

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
  appProperties?: Record<string, string>
  mimeType?: string
}

/** List subfolders in a folder */
export async function listFolders(
  token: string,
  parentId: string,
  pageSize = 100,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  let url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime desc&pageSize=${pageSize}`
  if (pageToken) url += `&pageToken=${pageToken}`

  const res = await driveFetch(url, token)
  return res.json()
}

/** Find a file by name inside a folder */
export async function findFileInFolder(
  token: string,
  folderId: string,
  fileName: string
): Promise<string | null> {
  const q = `'${folderId}' in parents and name='${fileName}' and trashed=false`
  const url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`

  const res = await driveFetch(url, token)
  const data = await res.json()
  return data.files?.[0]?.id ?? null
}

// ── Read operations ───────────────────────────────────────────

/** Read a file's JSON content */
export async function readJsonFile<T = unknown>(
  token: string,
  fileId: string
): Promise<T> {
  const res = await driveFetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    token
  )
  return res.json()
}

/** Read a file as text (e.g. markdown) */
export async function readTextFile(
  token: string,
  fileId: string
): Promise<string> {
  const res = await driveFetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    token
  )
  return res.text()
}

/** Read a file as a data URL (e.g. PNG → data:image/png;base64,...) */
export async function readFileAsDataUrl(
  token: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  const res = await driveFetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    token
  )
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(new Blob([blob], { type: mimeType }))
  })
}

// ── Write operations ──────────────────────────────────────────

/** Create a JSON file in a folder. Returns file ID. */
export async function createJsonFile(
  token: string,
  folderId: string,
  fileName: string,
  content: unknown,
  appProperties?: Record<string, string>
): Promise<string> {
  const metadata: Record<string, unknown> = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/json',
  }
  if (appProperties) {
    metadata.appProperties = appProperties
  }

  const boundary = '---muse-boundary'
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(content)}\r\n` +
    `--${boundary}--`

  const res = await driveFetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  )
  const data = await res.json()
  return data.id
}

/** Create a text file (e.g. markdown) in a folder. Returns file ID. */
export async function createTextFile(
  token: string,
  folderId: string,
  fileName: string,
  content: string
): Promise<string> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'text/markdown',
  }

  const boundary = '---muse-boundary'
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/markdown; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`

  const res = await driveFetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  )
  const data = await res.json()
  return data.id
}

/** Create a binary file (e.g. PNG) from a data URL. Returns file ID. */
export async function createBinaryFile(
  token: string,
  folderId: string,
  fileName: string,
  dataUrl: string,
  mimeType: string
): Promise<string> {
  // Convert data URL to blob
  const base64 = dataUrl.split(',')[1]
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mimeType })

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType,
  }

  // Build multipart body with binary content
  const metadataStr = JSON.stringify(metadata)
  const metadataPart = `--muse-boundary\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataStr}\r\n--muse-boundary\r\nContent-Type: ${mimeType}\r\n\r\n`
  const endPart = `\r\n--muse-boundary--`

  const metaBytes = new TextEncoder().encode(metadataPart)
  const endBytes = new TextEncoder().encode(endPart)
  const blobBytes = new Uint8Array(await blob.arrayBuffer())

  const combined = new Uint8Array(metaBytes.length + blobBytes.length + endBytes.length)
  combined.set(metaBytes, 0)
  combined.set(blobBytes, metaBytes.length)
  combined.set(endBytes, metaBytes.length + blobBytes.length)

  const res = await driveFetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=muse-boundary' },
      body: combined,
    }
  )
  const data = await res.json()
  return data.id
}

// ── Update operations ─────────────────────────────────────────

/** Update a JSON file's content (and optionally appProperties). */
export async function updateJsonFile(
  token: string,
  fileId: string,
  content: unknown,
  appProperties?: Record<string, string>
): Promise<void> {
  const boundary = '---muse-boundary'
  const metadata: Record<string, unknown> = {}
  if (appProperties) {
    metadata.appProperties = appProperties
  }

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(content)}\r\n` +
    `--${boundary}--`

  await driveFetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=multipart`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  )
}

/** Update a text file's content */
export async function updateTextFile(
  token: string,
  fileId: string,
  content: string
): Promise<void> {
  await driveFetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'text/markdown; charset=UTF-8' },
      body: content,
    }
  )
}

/** Update a binary file from a data URL */
export async function updateBinaryFile(
  token: string,
  fileId: string,
  dataUrl: string,
  mimeType: string
): Promise<void> {
  const base64 = dataUrl.split(',')[1]
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  await driveFetch(
    `${UPLOAD_API}/files/${fileId}?uploadType=media`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': mimeType },
      body: bytes,
    }
  )
}

// ── Delete operations ─────────────────────────────────────────

/** Permanently delete a file or folder (and all contents) */
export async function deleteFile(
  token: string,
  fileId: string
): Promise<void> {
  await driveFetch(`${DRIVE_API}/files/${fileId}`, token, {
    method: 'DELETE',
  })
}
