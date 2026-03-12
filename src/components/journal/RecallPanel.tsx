'use client'

import { useState, useRef, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AIRecallCard } from './AIRecallCard'
import { LoadingDots } from '@/components/ui/LoadingDots'
import type { Mood } from '@/types/journal'

interface Citation {
  id: string
  title: string
  excerpt: string
  createdAt: string
  mood: Mood | null
}

export interface RecallPanelProps {
  /** expanded=true: full-page layout with larger input */
  expanded?: boolean
}

export function RecallPanel({ expanded = false }: RecallPanelProps) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<Citation[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAsked, setHasAsked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q || isStreaming) return

    setIsStreaming(true)
    setAnswer('')
    setCitations([])
    setError(null)
    setHasAsked(true)

    try {
      const res = await fetch('/api/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
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
            if (parsed.type === 'citations') {
              setCitations(parsed.citations)
            } else if (parsed.type === 'text') {
              setAnswer((prev) => prev + parsed.text)
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
    }
  }

  function handleReset() {
    setQuery('')
    setAnswer('')
    setCitations([])
    setError(null)
    setHasAsked(false)
    inputRef.current?.focus()
  }

  return (
    <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-sm">
      {/* Input */}
      <form onSubmit={handleSubmit} className={`flex items-center gap-3 ${expanded ? 'px-5 py-4' : 'px-4 py-3'}`}>
        <span className="text-[#B5A99F] flex-shrink-0" aria-hidden="true">
          <svg width={expanded ? 20 : 16} height={expanded ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
            <path d="M12 8v4l3 3" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your journal… e.g. When did I last feel at peace?"
          className={`flex-1 bg-transparent border-none outline-none text-[#2C2825] placeholder:text-[#B5A99F] ${expanded ? 'text-base' : 'text-sm'}`}
          aria-label="Ask your journal a question"
          disabled={isStreaming}
          autoFocus={expanded}
        />
        {hasAsked ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Clear
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size={expanded ? 'md' : 'sm'}
            disabled={!query.trim() || isStreaming}
            loading={isStreaming}
          >
            Ask
          </Button>
        )}
      </form>

      {/* Results */}
      {hasAsked && (
        <div className="border-t border-[#E8E2D9] px-5 py-5 space-y-5 animate-fade-in">
          {/* Streaming answer */}
          {(answer || isStreaming) && (
            <div>
              <p className={`leading-relaxed text-[#2C2825] font-serif whitespace-pre-wrap ${expanded ? 'text-base' : 'text-sm'}`}>
                {answer}
                {isStreaming && !answer && <LoadingDots size="sm" />}
                {isStreaming && answer && (
                  <span className="inline-block w-0.5 h-4 bg-[#7C9E8A] animate-cursor-blink ml-0.5 align-text-bottom" />
                )}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className={`text-[#C4614E] ${expanded ? 'text-base' : 'text-sm'}`}>{error}</p>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#B5A99F] uppercase tracking-wide mb-3">
                From your journal
              </p>
              <div className="space-y-3">
                {citations.map((c) => (
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
  )
}
