import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalChunk } from '@/lib/db/models/JournalChunk'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { generateEmbedding } from '@/lib/embeddings/generate'
import { recallQuerySchema } from '@/lib/validations/journal'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// POST /api/recall — RAG query against user's journal chunks
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

    // 1. Embed the query
    console.log('[recall] generating query embedding...')
    const queryEmbedding = await generateEmbedding(query)
    console.log(`[recall] embedding generated dims=${queryEmbedding.length}`)

    const userObjectId = new mongoose.Types.ObjectId(userId)

    // 2. Vector search against chunks (not entries)
    console.log('[recall] running $vectorSearch on journalchunks...')
    const chunkResults = await JournalChunk.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10,
          filter: { userId: userObjectId },
        },
      },
      {
        $project: {
          _id: 1,
          entryId: 1,
          chunkIndex: 1,
          text: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ])
    console.log(`[recall] vectorSearch returned ${chunkResults.length} chunks`)

    if (chunkResults.length === 0) {
      console.log('[recall] no chunks found — returning empty response')
      return NextResponse.json({
        answer: "You don't have enough journal entries yet for me to recall from. Start writing and come back!",
        citations: [],
      })
    }

    // 3. Deduplicate by entryId — keep highest-scoring chunk per entry, preserve up to 5 entries
    const seenEntries = new Map<string, { chunk: typeof chunkResults[0]; score: number }>()
    for (const chunk of chunkResults) {
      const eid = String(chunk.entryId)
      if (!seenEntries.has(eid) || chunk.score > seenEntries.get(eid)!.score) {
        seenEntries.set(eid, { chunk, score: chunk.score })
      }
    }
    const topEntryIds = [...seenEntries.keys()].slice(0, 5)
    console.log(`[recall] ${topEntryIds.length} unique entries matched`)

    // 4. Fetch full entry metadata for citations
    const entries = await JournalEntry.find({ _id: { $in: topEntryIds } })
      .select('_id title body mood createdAt')
      .lean()

    const entryMap = new Map(entries.map((e) => [String(e._id), e]))

    // 5. Build context from best-matching chunks (preserves the relevant passage, not full body)
    const context = chunkResults
      .filter((c, idx, arr) => {
        // Keep all chunks from top entries, deduplicated by entryId+chunkIndex
        const key = `${c.entryId}-${c.chunkIndex}`
        return (
          topEntryIds.includes(String(c.entryId)) &&
          arr.findIndex((x) => `${x.entryId}-${x.chunkIndex}` === key) === idx
        )
      })
      .slice(0, 8)
      .map((c) => {
        const entry = entryMap.get(String(c.entryId))
        const date = entry
          ? new Date(entry.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })
          : 'Unknown date'
        const title = entry?.title ?? 'Untitled'
        return `[${title} — ${date}]\n${c.text}`
      })
      .join('\n\n---\n\n')

    // 6. Stream Claude response — try models in order, fall back on overload
    const claudeParams = {
      max_tokens: 1024,
      system: `You are a thoughtful journaling companion with access to a person's past journal entries.
Answer their question based strictly on what they have written. Be warm, reflective, and grounded in their actual words.
Do not invent or speculate beyond what the entries contain. If the entries don't answer the question, say so honestly.`,
      messages: [
        {
          role: 'user' as const,
          content: `Here are relevant passages from past journal entries:\n\n${context}\n\n---\n\nMy question: ${query}`,
        },
      ],
    }

    const models = ['claude-sonnet-4-6', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
    let stream
    for (const model of models) {
      try {
        console.log(`[recall] trying model=${model}`)
        stream = await getAnthropic().messages.stream({ ...claudeParams, model })
        console.log(`[recall] stream opened with model=${model}`)
        break
      } catch (err: unknown) {
        const isOverloaded = err instanceof Error && err.message.includes('overloaded_error')
        if (isOverloaded) {
          console.warn(`[recall] model=${model} overloaded, trying next...`)
        } else {
          throw err
        }
      }
    }

    const encoder = new TextEncoder()
    const citations = topEntryIds
      .map((eid) => entryMap.get(eid))
      .filter(Boolean)
      .map((e) => ({
        id: String(e!._id),
        title: e!.title,
        excerpt: (e!.body as string).slice(0, 120),
        createdAt: new Date(e!.createdAt).toISOString(),
        mood: e!.mood ?? null,
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
