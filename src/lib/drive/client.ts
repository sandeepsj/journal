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

/** Find or create the app folder. Returns folder ID. */
export async function getOrCreateAppFolder(token: string): Promise<string> {
  // Search for existing folder
  const q = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const searchUrl = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`

  const searchRes = await driveFetch(searchUrl, token)
  const searchData = await searchRes.json()

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id
  }

  // Create folder
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

/** List JSON files in a folder */
export async function listFiles(
  token: string,
  folderId: string,
  pageSize = 100,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const q = `'${folderId}' in parents and mimeType='application/json' and trashed=false`
  let url = `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime desc&pageSize=${pageSize}`
  if (pageToken) url += `&pageToken=${pageToken}`

  const res = await driveFetch(url, token)
  return res.json()
}

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
  appProperties?: Record<string, string>
}

/** Read a file's JSON content */
export async function readFile<T = unknown>(
  token: string,
  fileId: string
): Promise<T> {
  const res = await driveFetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    token
  )
  return res.json()
}

/** Create a JSON file in a folder. Returns the new file ID. */
export async function createFile(
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

  // Multipart upload: metadata + content in one request
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
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  const data = await res.json()
  return data.id
}

/** Update a file's JSON content (and optionally appProperties). */
export async function updateFile(
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
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )
}

/** Trash a file */
export async function deleteFile(
  token: string,
  fileId: string
): Promise<void> {
  await driveFetch(`${DRIVE_API}/files/${fileId}`, token, {
    method: 'DELETE',
  })
}
