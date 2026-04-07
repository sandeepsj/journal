import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from './_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await verifyAuth(req, res)
  if (!auth) return

  const { text } = req.body || {}
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing "text" field' })
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      return res.status(502).json({ error: 'OpenAI API error', detail: err })
    }

    const data = await openaiRes.json()
    return res.status(200).json({ embedding: data.data[0].embedding })
  } catch (err) {
    return res.status(500).json({ error: 'Embedding generation failed' })
  }
}
