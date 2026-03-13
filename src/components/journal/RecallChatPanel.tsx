'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AIRecallCard } from './AIRecallCard'
import { LoadingDots } from '@/components/ui/LoadingDots'

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
      parts.push(<strong key={key++} className="font-semibold text-[#2C2825]">{m.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{m.slice(1, -1)}</em>)
    }
    last = match.index + m.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function RecallChatPanel({ sessionId, initialMessages, onSessionCreated, onOpenSidebar }: RecallChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [query, setQuery] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!q || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: q }
    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsStreaming(true)
    setError(null)

    // Optimistic assistant bubble
    setMessages((prev) => [...prev, { role: 'assistant', content: '', citations: [] }])

    try {
      const res = await fetch('/api/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, sessionId }),
      })

      if (!res.ok) throw new Error('Recall failed')
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'session') {
              if (!sessionId && parsed.sessionId) {
                onSessionCreated(parsed.sessionId, q.slice(0, 40) + (q.length > 40 ? '...' : ''))
              }
            } else if (parsed.type === 'citations') {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], citations: parsed.citations }
                return next
              })
            } else if (parsed.type === 'text') {
              setMessages((prev) => {
                const next = [...prev]
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + parsed.text }
                return next
              })
            } else if (parsed.type === 'error') {
              setError('AI is busy right now, please try again in a moment.')
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Remove the empty optimistic bubble on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF9F7] relative">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center h-14 px-4 border-b border-[#E8E2D9] bg-white sticky top-0 z-10 gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-1.5 text-[#847B73] hover:text-[#2C2825] rounded-md hover:bg-[#F2EEE8] transition-colors"
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <span className="font-serif text-lg text-[#2C2825] truncate flex-1">
          {sessionId ? 'Conversation' : 'Ask your journal'}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-[#EAF1EC] rounded-full flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C9E8A" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl text-[#2C2825] mb-3">Ask your journal anything</h2>
            <p className="text-[#847B73] max-w-sm leading-relaxed">
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
                  className="text-sm text-[#8B7D72] bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 hover:border-[#7C9E8A] hover:text-[#2C2825] transition-colors text-left"
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EAF1EC] flex items-center justify-center mt-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C9E8A" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'user' ? 'rounded-2xl rounded-tr-sm px-4 py-3 bg-[#7C9E8A] text-white text-base leading-relaxed' : 'text-[#2C2825] leading-relaxed'}`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {msg.content ? (
                        <p className="font-serif text-base whitespace-pre-wrap text-[#2C2825]">
                          {renderMarkdown(msg.content)}
                          {isStreaming && idx === messages.length - 1 && (
                            <span className="inline-block w-0.5 h-4 bg-[#7C9E8A] animate-cursor-blink ml-1 align-middle" />
                          )}
                        </p>
                      ) : (
                        isStreaming && idx === messages.length - 1 && (
                          <div className="py-2"><LoadingDots size="sm" /></div>
                        )
                      )}

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-5 border-t border-[#E8E2D9] pt-4">
                          <p className="text-xs font-medium text-[#B5A99F] uppercase tracking-wide mb-3">
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
              <div className="bg-[#FAF5F4] text-[#C4614E] px-4 py-3 rounded-xl text-sm text-center max-w-sm mx-auto border border-[#F5C4C4]">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#FAF9F7] via-[#FAF9F7]/95 to-transparent pt-8 pb-5 px-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white border border-[#E8E2D9] rounded-2xl shadow-sm flex items-end gap-2 px-4 py-3 focus-within:border-[#7C9E8A] focus-within:ring-2 focus-within:ring-[#7C9E8A]/20 transition-all"
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
            className="flex-1 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-none text-base text-[#2C2825] placeholder:text-[#B5A99F] py-0.5"
            rows={1}
            style={{ maxHeight: '8rem' }}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!query.trim() || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[#7C9E8A] text-white flex items-center justify-center hover:bg-[#6A9B77] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
        <p className="text-center mt-2 text-[11px] text-[#B5A99F]">
          Answers are based on your journal entries only
        </p>
      </div>
    </div>
  )
}
