import { useState, useRef, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { loadAllEmbeddings } from '@/lib/drive'
import { findSimilar, type EmbeddedEntry } from '@/lib/search/cosine'
import { AIRecallCard } from './AIRecallCard'
import { LoadingDots } from '@/components/ui/LoadingDots'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface Citation {
  id: string
  title: string
  excerpt: string
  createdAt: string
  mood: 'calm' | 'happy' | 'anxious' | 'sad' | 'grateful' | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

interface RecallChatPanelProps {
  sessionId: string | null
  initialMessages: ChatMessage[]
  onSessionCreated: (id: string, title: string) => void
  onOpenSidebar: () => void
}

/** Render **bold** and *italic* markdown in AI responses */
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = []
  // Split on **bold** and *italic* markers
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let match
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const m = match[0]
    if (m.startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-[var(--color-text-primary)]">{m.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{m.slice(1, -1)}</em>)
    }
    last = match.index + m.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function RecallChatPanel({ sessionId, initialMessages, onSessionCreated, onOpenSidebar }: RecallChatPanelProps) {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [query, setQuery] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const embeddingsRef = useRef<EmbeddedEntry[] | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Sync messages when switching sessions
  useEffect(() => {
    setMessages(initialMessages)
    setIsStreaming(false)
  }, [initialMessages])

  // Reset when starting new chat
  useEffect(() => {
    if (sessionId === null) {
      setMessages([])
      setQuery('')
      setError(null)
      setIsStreaming(false)
    }
  }, [sessionId])

  // Auto-resize textarea
  function handleQueryChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  async function handleSubmit(e: FormEvent | React.KeyboardEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || isStreaming || !accessToken || !API_BASE) return

    const userMessage: ChatMessage = { role: 'user', content: q }
    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsStreaming(true)
    setError(null)

    // Optimistic assistant bubble
    setMessages((prev) => [...prev, { role: 'assistant', content: '', citations: [] }])

    try {
      // 1. Load embeddings (cached after first call)
      if (!embeddingsRef.current) {
        embeddingsRef.current = await loadAllEmbeddings(accessToken)
      }

      // 2. Embed the query via Vercel proxy
      const embedRes = await fetch(`${API_BASE}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: q }),
      })
      if (!embedRes.ok) throw new Error('Failed to embed query')
      const { embedding: queryEmbedding } = await embedRes.json()

      // 3. Find similar entries via cosine similarity
      const similar = findSimilar(queryEmbedding, embeddingsRef.current, 5)

      // Build citations for UI
      const citations: Citation[] = similar.map((s) => ({
        id: s.fileId,
        title: s.title,
        excerpt: s.body.slice(0, 120) + (s.body.length > 120 ? '...' : ''),
        createdAt: '',
        mood: null,
      }))

      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { ...next[next.length - 1], citations }
        return next
      })

      // 4. Send context to /api/recall for AI answer
      const context = similar.map((s) => ({ title: s.title, body: s.body }))
      const recallRes = await fetch(`${API_BASE}/api/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: q, context }),
      })
      if (!recallRes.ok) throw new Error('Recall failed')
      const { answer } = await recallRes.json()

      // Create a session ID for new conversations
      if (!sessionId) {
        const newSessionId = crypto.randomUUID()
        onSessionCreated(newSessionId, q.slice(0, 40) + (q.length > 40 ? '...' : ''))
      }

      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { ...next[next.length - 1], content: answer }
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface-muted)] relative">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-14 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-10 gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-surface-muted)] transition-colors"
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md hover:bg-[var(--color-surface-muted)] transition-colors"
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <span className="font-serif text-lg text-[var(--color-text-primary)] truncate flex-1">
          {sessionId ? 'Conversation' : 'Ask your journal'}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-[var(--color-accent-light)] rounded-full flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl text-[var(--color-text-primary)] mb-3">Ask your journal anything</h2>
            <p className="text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
              I can help you recall patterns, insights, and memories from your entries.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md text-left">
              {[
                'What have I been grateful for lately?',
                'When did I last feel at peace?',
                'What patterns do I notice in my moods?',
                'What did I write about this week?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion)
                    textareaRef.current?.focus()
                  }}
                  className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6 pb-40">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mt-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'rounded-2xl rounded-tr-sm px-4 py-3 bg-[var(--color-accent)] text-white text-base leading-relaxed' : 'text-[var(--color-text-primary)] leading-relaxed'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {msg.content ? (
                        <p className="font-serif text-base whitespace-pre-wrap text-[var(--color-text-primary)]">
                          {renderMarkdown(msg.content)}
                          {isStreaming && idx === messages.length - 1 && (
                            <span className="inline-block w-0.5 h-4 bg-[var(--color-accent)] animate-cursor-blink ml-1 align-middle" />
                          )}
                        </p>
                      ) : (
                        isStreaming && idx === messages.length - 1 && (
                          <div className="py-2"><LoadingDots size="sm" /></div>
                        )
                      )}

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                            From your journal
                          </p>
                          <div className="space-y-2">
                            {msg.citations.map((c) => (
                              <AIRecallCard
                                key={c.id}
                                title={c.title}
                                excerpt={c.excerpt}
                                createdAt={c.createdAt}
                                mood={c.mood}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] px-4 py-3 rounded-xl text-sm text-center max-w-sm mx-auto border border-[var(--color-error)]/20">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[var(--color-surface-muted)] via-[var(--color-surface-muted)]/95 to-transparent pt-8 pb-5 px-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm flex items-end gap-2 px-4 py-3 focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 transition-all"
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ask your journal anything… (Enter to send)"
            className="flex-1 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-none text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] py-0.5"
            rows={1}
            style={{ maxHeight: '8rem' }}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Send"
          >
            {isStreaming ? (
              <span className="w-3 h-3 rounded-sm bg-white opacity-90" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-center mt-2 text-[11px] text-[var(--color-text-muted)]">
          Answers are based on your journal entries only
        </p>
      </div>
    </div>
  )
}
