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

  const { content } = req.body || {}
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing "content" field' })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are Eemo, a gentle emotional presence. Read this journal entry and respond with JSON only — no other text.

Journal entry:
"""
${content}
"""

Respond with exactly this JSON format:
{"emotion": "<one of: happy, sad, calm, anxious, grateful, angry, surprised, disgusted, fearful>", "message": "<a warm, brief 1-sentence reflection>"}`,
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      return res.status(502).json({ error: 'Claude API error', detail: err })
    }

    const data = await anthropicRes.json()
    const text = data.content?.[0]?.text || '{}'

    try {
      const parsed = JSON.parse(text)
      return res.status(200).json(parsed)
    } catch {
      return res.status(200).json({ emotion: null, message: null })
    }
  } catch {
    return res.status(500).json({ error: 'Eemo analysis failed' })
  }
}
