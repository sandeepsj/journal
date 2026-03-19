import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/options'

// These match the full list from react-emotion-face's getEmotions()
const VALID_EMOTIONS = [
  'happy', 'sad', 'angry', 'mad', 'surprised', 'calm', 'sleepy', 'excited',
  'tired', 'confused', 'embarrassed', 'nervous', 'proud', 'disgusted', 'bored',
  'love', 'silly', 'determined', 'shy', 'anxious', 'laughing',
] as const

type Emotion = typeof VALID_EMOTIONS[number]

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// POST /api/eemo — analyze journal content and return emotion + optional message
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return NextResponse.json({ emotion: 'calm', message: null })
    }

    const systemPrompt = `You are Eemo, a quiet caring friend who silently watches someone write in their journal.
You react to the emotional tone of what they're writing.

Available emotions: [${VALID_EMOTIONS.join(', ')}]

Respond ONLY with valid JSON: {"emotion": "<emotion>", "message": "<string or null>"}

Rules:
- emotion: pick the one that best matches the tone of the last part of the entry
- message: null in most cases. Only include a message (max 20 words) when the writer
  shows signs of distress, self-harm, strong grief, or a genuinely proud/breakthrough moment.
  Never give advice. React as a caring friend would, briefly.
- When in doubt, message is null.`

    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: content.slice(-2000), // send last 2000 chars for recency
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    let parsed: { emotion: string; message: string | null }
    try {
      // Extract JSON from response (strip any surrounding text just in case)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { emotion: 'calm', message: null }
    } catch {
      parsed = { emotion: 'calm', message: null }
    }

    // Validate emotion is in the allowed list
    const validEmotions = new Set<string>(VALID_EMOTIONS)
    const emotion: Emotion = validEmotions.has(parsed.emotion) ? (parsed.emotion as Emotion) : 'calm'
    const message = typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null

    return NextResponse.json({ emotion, message })
  } catch (err) {
    console.error('[eemo] error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
