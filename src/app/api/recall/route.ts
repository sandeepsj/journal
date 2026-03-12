import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth/options'
import { connectDB } from '@/lib/db/client'
import { JournalChunk } from '@/lib/db/models/JournalChunk'
import { JournalEntry } from '@/lib/db/models/JournalEntry'
import { ChatSession } from '@/lib/db/models/ChatSession'
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

    const { query, sessionId } = parsed.data
    console.log(`[recall] query="${query.slice(0, 80)}"`)

    await connectDB()

    const userObjectId = new mongoose.Types.ObjectId(userId)

    let chatSession
    if (sessionId) {
      chatSession = await ChatSession.findOne({ _id: sessionId, userId: userObjectId })
      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    } else {
      // Create new session if none provided
      chatSession = await ChatSession.create({
        userId: userObjectId,
        title: query.slice(0, 40) + (query.length > 40 ? '...' : ''),
        messages: [],
      })
    }

    // Add user message to session
    chatSession.messages.push({
      role: 'user',
      content: query,
      createdAt: new Date(),
    })
    await chatSession.save()

    // 1. Embed the query
    console.log('[recall] generating query embedding...')
    const queryEmbedding = await generateEmbedding(query)
    console.log(`[recall] embedding generated dims=${queryEmbedding.length}`)

    // 2. Try chunks first; fall back to full entries if journalchunks index not ready
    console.log('[recall] running $vectorSearch...')
    let context = ''
    let citations: { id: string; title: string; excerpt: string; createdAt: string; mood: string | null }[] = []

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
      { $project: { _id: 1, entryId: 1, chunkIndex: 1, text: 1, score: { $meta: 'vectorSearchScore' } } },
    ]).catch(() => [])  // if index doesn't exist yet, return empty

    console.log(`[recall] chunks found=${chunkResults.length}`)

    if (chunkResults.length > 0) {
      // Deduplicate by entryId
      const seenEntries = new Map<string, number>()
      for (const c of chunkResults) {
        const eid = String(c.entryId)
        if (!seenEntries.has(eid)) seenEntries.set(eid, c.score)
      }
      const topEntryIds = [...seenEntries.keys()].slice(0, 5)

      const entries = await JournalEntry.find({ _id: { $in: topEntryIds } })
        .select('_id title body mood createdAt').lean()
      const entryMap = new Map(entries.map((e) => [String(e._id), e]))

      context = chunkResults.slice(0, 8).map((c) => {
        const entry = entryMap.get(String(c.entryId))
        const date = entry ? new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
        return `[${entry?.title ?? 'Entry'} — ${date}]\n${c.text}`
      }).join('\n\n---\n\n')

      citations = topEntryIds.map((eid) => entryMap.get(eid)).filter(Boolean).map((e) => ({
        id: String(e!._id),
        title: e!.title,
        excerpt: (e!.body as string).slice(0, 120),
        createdAt: new Date(e!.createdAt).toISOString(),
        mood: e!.mood ?? null,
      }))
    } else {
      // Fallback: search journalentries directly
      console.log('[recall] falling back to journalentries search')
      const entryResults = await JournalEntry.aggregate([
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
        { $project: { _id: 1, title: 1, body: 1, mood: 1, createdAt: 1, score: { $meta: 'vectorSearchScore' } } },
      ])

      console.log(`[recall] entry fallback found=${entryResults.length}`)

      // Instead of failing entirely, just use empty context if no entries found.
      if (entryResults.length > 0) {
        context = entryResults.map((e, i) => {
          const date = new Date(e.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          return `[Entry ${i + 1} — ${date}]\nTitle: ${e.title}\n\n${e.body}`
        }).join('\n\n---\n\n')

        citations = entryResults.map((e) => ({
          id: String(e._id),
          title: e.title,
          excerpt: (e.body as string).slice(0, 120),
          createdAt: new Date(e.createdAt).toISOString(),
          mood: e.mood ?? null,
        }))
      }
    }

    // Build chat history for Anthropic
    const previousMessages = chatSession.messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content,
    }))

    // Add exactly one system-like or prompt-enriched message as the final message
    const userPromptContent = `Here are relevant passages from past journal entries:\n\n${context}\n\n---\n\nMy question: ${query}`

    const messages = [
      ...previousMessages,
      {
        role: 'user' as const,
        content: userPromptContent,
      },
    ]

    // 6. Stream Claude response — try models in order, fall back on overload
    const claudeParams = {
      max_tokens: 1024,
      system: `You are a thoughtful journaling companion with access to a person's past journal entries.
Answer their question based strictly on what they have written. Be warm, reflective, and grounded in their actual words.
Do not invent or speculate beyond what the entries contain. If the entries don't answer the question, say so honestly.`,
      messages,
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

    const readable = new ReadableStream({
      async start(controller) {
        let fullResponseText = ''

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'session', sessionId: chatSession._id })}\n\n`)
          )

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
              fullResponseText += chunk.delta.text
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
        } finally {
          // Save assistant's message in DB
          try {
            await ChatSession.updateOne(
              { _id: chatSession._id },
              {
                $push: {
                  messages: {
                    role: 'assistant',
                    content: fullResponseText,
                    citations,
                    createdAt: new Date(),
                  },
                },
              }
            )
          } catch (err) {
            console.error('[recall] error saving assistant response:', err)
          }
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
