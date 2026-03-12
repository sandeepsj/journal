'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AIRecallCard } from './AIRecallCard'
import { LoadingDots } from '@/components/ui/LoadingDots'

// We reuse IChatMessage interface without Mongoose overhead
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

export function RecallChatPanel({ sessionId, initialMessages, onSessionCreated, onOpenSidebar }: RecallChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [query, setQuery] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Sync messages if sessionId changes, avoiding overwriting local state mid-stream
  useEffect(() => {
    setMessages(initialMessages)
    setIsStreaming(false)
  }, [initialMessages])

  // Clear everything when starting a completely new chat
  useEffect(() => {
    if (sessionId === null) {
      setMessages([])
      setQuery('')
      setError(null)
      setIsStreaming(false)
    }
  }, [sessionId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: q }
    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    setIsStreaming(true)
    setError(null)

    // Append temporary assistant message
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
      let returnedSessionId: string | null = null

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
              returnedSessionId = parsed.sessionId
              if (!sessionId && returnedSessionId) {
                onSessionCreated(returnedSessionId, q.slice(0, 40) + (q.length > 40 ? '...' : ''))
              }
            } else if (parsed.type === 'citations') {
              setMessages((prev) => {
                const newMsgs = [...prev]
                const lastMsg = newMsgs[newMsgs.length - 1]
                newMsgs[newMsgs.length - 1] = { 
                  ...lastMsg, 
                  citations: parsed.citations 
                }
                return newMsgs
              })
            } else if (parsed.type === 'text') {
              setMessages((prev) => {
                const newMsgs = [...prev]
                const lastMsg = newMsgs[newMsgs.length - 1]
                newMsgs[newMsgs.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + parsed.text
                }
                return newMsgs
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
    } finally {
      setIsStreaming(false)
      // Slight delay to focus so mobile keyboards don't act weird instantly
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FAF9F7] relative">
      <header className="flex-shrink-0 flex items-center h-14 px-4 border-b border-[#E8E2D9] bg-white sticky top-0 z-10">
        <button
          onClick={onOpenSidebar}
          className="md:hidden mr-3 p-1 text-[#847B73] hover:text-[#2C2825]"
          title="Open Sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="flex-1 font-serif text-[#2C2825] truncate">
          {sessionId ? 'Chat Session' : 'Ask Your Journal'}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-[#F3EEEA] rounded-full flex items-center justify-center mb-6 text-[#7C9E8A]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl text-[#2C2825] mb-3">Ask your journal anything</h2>
            <p className="text-[#847B73] max-w-sm mb-8 leading-relaxed">
              I can help you recall patterns, insights, and memories from your entries.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 min-h-full pb-32">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8E2D9] flex items-center justify-center text-[#2C2825] mt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                    msg.role === 'user'
                      ? 'bg-[#F2EEE8] text-[#2C2825] font-medium leading-relaxed border border-[#E8E2D9]'
                      : 'bg-transparent text-[#2C2825] leading-relaxed font-serif'
                  }`}
                >
                  {/* User message is plain text, Assistant is rich text with citations */}
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div>
                      {msg.content ? (
                        <div className="whitespace-pre-wrap text-base">
                          {msg.content}
                          {isStreaming && idx === messages.length - 1 && (
                            <span className="inline-block w-0.5 h-4 bg-[#7C9E8A] animate-cursor-blink ml-1 align-middle" />
                          )}
                        </div>
                      ) : (
                        isStreaming && idx === messages.length - 1 && <LoadingDots size="sm" />
                      )}

                      {/* Citations block for AI role */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-6 border-t border-[#E8E2D9] pt-4">
                          <p className="text-xs font-medium text-[#B5A99F] uppercase tracking-wide mb-3">
                            From your journal
                          </p>
                          <div className="space-y-3">
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
              <div className="bg-[#FAF5F4] text-[#C4614E] px-4 py-3 rounded-xl text-center max-w-sm mx-auto">
                {error}
              </div>
            )}
            
            <div ref={bottomRef} className="h-px w-full" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#FAF9F7] via-[#FAF9F7] to-transparent pt-10 pb-4 md:pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E8E2D9] rounded-2xl shadow-sm overflow-hidden flex items-end px-3 py-2 md:py-3 focus-within:ring-2 ring-[#7C9E8A]/20 focus-within:border-[#7C9E8A] transition-all"
          >
            <textarea
              ref={inputRef as any}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              placeholder="What would you like to know?"
              className="flex-1 max-h-32 min-h-[2.5rem] bg-transparent border-none outline-none resize-none px-3 py-2 text-[#2C2825] placeholder-[#B5A99F]"
              rows={1}
              disabled={isStreaming}
              // autoFocus
            />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="mb-1 mr-1 px-2.5 py-2.5 rounded-full bg-[#E8E2D9] hover:bg-[#D5D0C8] text-[#2C2825] border-transparent"
              disabled={!query.trim() || isStreaming}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isStreaming ? "animate-pulse" : ""}>
                {isStreaming ? (
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                ) : (
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                )}
              </svg>
            </Button>
          </form>
          <div className="text-center mt-2 font-serif text-[11px] text-[#B5A99F]">
            AI Recall can make mistakes based on entries. Verify the citations.
          </div>
        </div>
      </div>
    </div>
  )
}
