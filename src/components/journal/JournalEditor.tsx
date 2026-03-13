'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { MoodSelector } from './MoodSelector'
import { WordCount } from './WordCount'
import { AutoSaveStatus } from './AutoSaveStatus'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useWordCount } from '@/hooks/useWordCount'
import type { Mood } from '@/types/journal'

export interface JournalEditorProps {
  entryId?: string
  initialTitle?: string
  initialBody?: string
  initialMood?: Mood | null
}

export function JournalEditor({
  entryId,
  initialTitle = '',
  initialBody = '',
  initialMood = null,
}: JournalEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [mood, setMood] = useState<Mood | null>(initialMood)

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const savedEntryIdRef = useRef<string | null>(entryId ?? null)

  const wordCount = useWordCount(body)

  // Auto-resize textarea — must stay in sync with ruled lines
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  useEffect(() => {
    if (!entryId) bodyRef.current?.focus()
  }, [entryId])

  const handleSave = useCallback(
    async (data: { title: string; body: string; mood: Mood | null }) => {
      const hasContent = data.title.trim() || data.body.trim()
      if (!hasContent) return

      const isNew = !savedEntryIdRef.current
      const url = isNew ? '/api/journal' : `/api/journal/${savedEntryIdRef.current}`

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Save failed')

      if (isNew) {
        const json = await res.json()
        savedEntryIdRef.current = json.id
      }
    },
    []
  )

  const { status, save } = useAutoSave({
    data: { title, body, mood },
    onSave: handleSave,
    interval: 30000,
  })

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  const isEmpty = !title.trim() && !body.trim()

  return (
    <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown}>
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E8E2D9] bg-[#FAF8F5] sticky top-0 z-10">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-[#8B7D72] hover:text-[#2C2825] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] rounded-md px-1"
          aria-label="Back to dashboard"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>

        <AutoSaveStatus status={status} />

        <Button
          variant="ghost"
          size="sm"
          onClick={save}
          loading={status === 'saving'}
          disabled={isEmpty}
          aria-label="Save entry (Cmd+Enter)"
        >
          <span className="hidden sm:inline mr-1">Save</span>
          <kbd className="text-[10px] text-[#B5A99F] font-mono bg-[#F2EEE8] px-1.5 py-0.5 rounded border border-[#E8E2D9]">
            ⌘↵
          </kbd>
        </Button>
      </header>

      {/* ── Paper container ──────────────────────────────── */}
      <div className="flex-1 flex justify-center px-4 py-8 animate-page-enter">
        {/*
          The paper: white ruled background, fixed max-width, full height.
          Shadow gives it lift off the dotted page background.
        */}
        <div
          className="ruled-paper w-full max-w-4xl rounded-sm shadow-md flex flex-col"
          style={{ minHeight: 'calc(100vh - 10rem)' }}
        >
          {/* Paper header — date + title, above the ruled lines */}
          <div className="pt-8 pb-4 pr-6 border-b border-[#EAE4DC]" style={{ paddingLeft: 'calc(var(--rule-margin) + 1.25rem)' }}>
            <p className="text-sm text-[#B5A99F] mb-4 tabular-nums">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={300}
              className="w-full font-serif text-4xl sm:text-5xl bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-[#D4CEC8] text-[#2C2825] leading-tight caret-[#7C9E8A]"
              aria-label="Entry title"
            />
          </div>

          {/* Ruled writing area */}
          <div className="flex-1 px-0 pt-0 pb-8">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing..."
              className="ruled-text w-full bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-none placeholder:text-[#D4CEC8] text-[#2C2825] text-xl"
              style={{
                caretColor: '#7C9E8A',
                minHeight: 'calc(var(--rule-h) * 12)',
                fontFamily: 'var(--font-lora), Georgia, serif',
              }}
              aria-label="Entry body"
              spellCheck
            />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────── */}
      <footer className="sticky bottom-0 flex items-center justify-between px-6 py-3 border-t border-[#E8E2D9] bg-[#FAF8F5]">
        <MoodSelector value={mood} onChange={setMood} />
        <WordCount count={wordCount} />
      </footer>
    </div>
  )
}
