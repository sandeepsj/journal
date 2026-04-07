import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from './_lib/auth.js'

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

  const { query, context } = req.body || {}
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing "query" field' })
  }

  // context = array of relevant journal excerpts found via client-side vector search
  const contextBlock = Array.isArray(context)
    ? context.map((c: { title: string; body: string }, i: number) =>
        `--- Entry ${i + 1}: "${c.title}" ---\n${c.body}`
      ).join('\n\n')
    : 'No past entries provided.'

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are a thoughtful journal companion. The user is asking a question about their past journal entries. Answer warmly and personally, referencing specific entries when relevant. If the context doesn't contain relevant information, say so honestly.`,
        messages: [
          {
            role: 'user',
            content: `Here are my relevant journal entries:\n\n${contextBlock}\n\nMy question: ${query}`,
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return res.status(502).json({ error: 'Claude API error', detail: err })
    }

    const data = await anthropicRes.json()
    const answer = data.content?.[0]?.text || 'I could not generate a response.'

    return res.status(200).json({ answer })
  } catch {
    return res.status(500).json({ error: 'Recall failed' })
  }
}
