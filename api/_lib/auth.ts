import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_USERS = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

interface AuthResult {
  email: string
}

/**
 * Validate the Google OAuth access token from the Authorization header.
 * Returns the user's email if valid and allowed.
 * Sends an error response and returns null if not.
 */
export async function verifyAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthResult | null> {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'No authorization token' })
    return null
  }

  try {
    const googleRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!googleRes.ok) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return null
    }

    const data = await googleRes.json()
    const email = (data.email || '').toLowerCase()

    if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(email)) {
      res.status(403).json({ error: 'Not authorized' })
      return null
    }

    return { email }
  } catch {
    res.status(500).json({ error: 'Auth verification failed' })
    return null
  }
}
