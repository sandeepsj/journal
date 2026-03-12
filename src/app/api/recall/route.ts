import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth/options'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}
import { connectDB } from '@/lib/db/client'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { generateEmbedding } from '@/lib/embeddings/generate'
import { recallQuerySchema } from '@/lib/validations/journal'

// POST /api/recall — RAG query against user's journal entries
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = recallQuerySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { query } = parsed.data

  await connectDB()

  // 1. Embed the query
  const queryEmbedding = await generateEmbedding(query)

  // 2. Vector search — top 5 entries for this user
  // Note: Requires MongoDB Atlas Vector Search index named "journal_embedding_index"
  const pipeline = [
    {
      $vectorSearch: {
        index: 'journal_embedding_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 50,
        limit: 5,
        filter: { userId: session.user.id },
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

  if (retrieved.length === 0) {
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

  // 4. Stream Claude response
  const stream = await getAnthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a thoughtful journaling companion with access to a person's past journal entries.
Answer their question based strictly on what they have written. Be warm, reflective, and grounded in their actual words.
Do not invent or speculate beyond what the entries contain. If the entries don't answer the question, say so honestly.`,
    messages: [
      {
        role: 'user',
        content: `Here are relevant past journal entries:\n\n${context}\n\n---\n\nMy question: ${query}`,
      },
    ],
  })

  // Return streaming response
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
      // First chunk: citations metadata
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
      )

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', text: chunk.delta.text })}\n\n`)
          )
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
