import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { generateEmbedding } from '@/lib/embeddings/generate'
import { recallQuerySchema } from '@/lib/validations/journal'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// POST /api/recall — RAG query against user's journal entries
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    console.log(`[recall] start userId=${userId}`)

    const body = await request.json()
    const parsed = recallQuerySchema.safeParse(body)
    if (!parsed.success) {
      console.warn('[recall] validation failed:', parsed.error.flatten())
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { query } = parsed.data
    console.log(`[recall] query="${query.slice(0, 80)}"`)

    await connectDB()
    console.log('[recall] db connected')

    // 1. Embed the query
    console.log('[recall] generating query embedding...')
    const queryEmbedding = await generateEmbedding(query)
    console.log(`[recall] embedding generated dims=${queryEmbedding.length}`)

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // 2. Vector search — filtered by userId at Atlas level (requires filter field in index)
    console.log('[recall] running $vectorSearch pipeline...')
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 50,
          limit: 5,
          filter: { userId: userObjectId },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          body: 1,
          mood: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ]

    const retrieved = await JournalEntry.aggregate(pipeline)
    console.log(`[recall] vectorSearch returned ${retrieved.length} results`)

    if (retrieved.length === 0) {
      console.log('[recall] no entries found — returning empty response')
      return NextResponse.json({
        answer: "You don't have enough journal entries yet for me to recall from. Start writing and come back!",
        citations: [],
      })
    }

    // 3. Build prompt from retrieved entries
    const context = retrieved
      .map((e, i) => {
        const date = new Date(e.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
        return `[Entry ${i + 1} — ${date}]\nTitle: ${e.title}\n\n${e.body}`
      })
      .join('\n\n---\n\n')

    // 4. Stream Claude response — retry up to 3 times on overload
    const claudeParams = {
      model: 'claude-sonnet-4-6' as const,
      max_tokens: 1024,
      system: `You are a thoughtful journaling companion with access to a person's past journal entries.
Answer their question based strictly on what they have written. Be warm, reflective, and grounded in their actual words.
Do not invent or speculate beyond what the entries contain. If the entries don't answer the question, say so honestly.`,
      messages: [
        {
          role: 'user' as const,
          content: `Here are relevant past journal entries:\n\n${context}\n\n---\n\nMy question: ${query}`,
        },
      ],
    }

    let stream
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[recall] starting Claude stream (attempt ${attempt})...`)
        stream = await getAnthropic().messages.stream(claudeParams)
        break
      } catch (err: unknown) {
        const isOverloaded =
          err instanceof Error && err.message.includes('overloaded_error')
        if (isOverloaded && attempt < 3) {
          const delay = attempt * 2000
          console.warn(`[recall] Claude overloaded, retrying in ${delay}ms...`)
          await new Promise((r) => setTimeout(r, delay))
        } else {
          throw err
        }
      }
    }
    console.log('[recall] Claude stream opened, returning SSE response')

    const encoder = new TextEncoder()
    const citations = retrieved.map((e) => ({
      id: String(e._id),
      title: e.title,
      excerpt: (e.body as string).slice(0, 120),
      createdAt: new Date(e.createdAt).toISOString(),
      mood: e.mood ?? null,
    }))

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
          )

          let chunkCount = 0
          for await (const chunk of stream!) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              chunkCount++
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`)
              )
            }
          }

          console.log(`[recall] stream complete chunks=${chunkCount}`)
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (streamErr) {
          console.error('[recall] stream error:', streamErr)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Streaming failed' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[recall] fatal error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
