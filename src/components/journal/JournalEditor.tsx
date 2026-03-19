'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { MoodSelector } from './MoodSelector'
import { WordCount } from './WordCount'
import { AutoSaveStatus } from './AutoSaveStatus'
import { DrawingCanvas } from './DrawingCanvas'
import { DrawingToolbar } from './DrawingToolbar'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useWordCount } from '@/hooks/useWordCount'
import type { Mood } from '@/types/journal'

export interface JournalEditorProps {
  entryId?: string
  initialTitle?: string
  initialBody?: string
  initialMood?: Mood | null
  initialTextColor?: string
  initialDrawing?: string | null
  initialPinned?: boolean
}

export function JournalEditor({
  entryId,
  initialTitle = '',
  initialBody = '',
  initialMood = null,
  initialTextColor = '#2C2825',
  initialDrawing = null,
  initialPinned = false,
}: JournalEditorProps) {
  const router = useRouter()
  const [isPinned, setIsPinned] = useState(initialPinned)
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [mood, setMood] = useState<Mood | null>(initialMood)
  const [mode, setMode] = useState<'write' | 'draw'>('write')
  const [textColor, setTextColor] = useState(initialTextColor)
  const [brushColor, setBrushColor] = useState('#2C2825')
  const [brushSize, setBrushSize] = useState(2)
  const [eraserSize, setEraserSize] = useState(14)
  const [erasing, setErasing] = useState(false)
  const [drawingData, setDrawingData] = useState<string | null>(initialDrawing)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [canUndoText, setCanUndoText] = useState(false)
  const [canRedoText, setCanRedoText] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const savedEntryIdRef = useRef<string | null>(entryId ?? null)
  const drawingHistoryRef = useRef<string[]>([])
  const drawingFutureRef = useRef<string[]>([])
  const textHistoryRef = useRef<Array<{ title: string; body: string }>>([])
  const textFutureRef = useRef<Array<{ title: string; body: string }>>([])
  const textCurrentRef = useRef({ title: initialTitle, body: initialBody })
  const textLastCommitRef = useRef({ title: initialTitle, body: initialBody })
  const textDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function pushToHistory(current: string | null) {
    if (current !== null) {
      drawingHistoryRef.current = [...drawingHistoryRef.current.slice(-29), current]
    }
    drawingFutureRef.current = []
    setCanUndo(drawingHistoryRef.current.length > 0)
    setCanRedo(false)
  }

  function handleDrawingChange(dataUrl: string) {
    pushToHistory(drawingData)
    setDrawingData(dataUrl)
  }

  function handleUndo() {
    if (drawingHistoryRef.current.length === 0) return
    const prev = drawingHistoryRef.current[drawingHistoryRef.current.length - 1]
    drawingHistoryRef.current = drawingHistoryRef.current.slice(0, -1)
    if (drawingData !== null) {
      drawingFutureRef.current = [drawingData, ...drawingFutureRef.current]
    }
    setDrawingData(prev)
    setCanUndo(drawingHistoryRef.current.length > 0)
    setCanRedo(true)
  }

  function handleRedo() {
    if (drawingFutureRef.current.length === 0) return
    const next = drawingFutureRef.current[0]
    drawingFutureRef.current = drawingFutureRef.current.slice(1)
    if (drawingData !== null) {
      drawingHistoryRef.current = [...drawingHistoryRef.current, drawingData]
    }
    setDrawingData(next)
    setCanUndo(true)
    setCanRedo(drawingFutureRef.current.length > 0)
  }

  function handleClearDrawing() {
    pushToHistory(drawingData)
    setDrawingData(null)
  }

  function commitTextHistory() {
    const prev = textLastCommitRef.current
    const curr = textCurrentRef.current
    if (prev.title === curr.title && prev.body === curr.body) return
    textHistoryRef.current = [...textHistoryRef.current.slice(-29), prev]
    textFutureRef.current = []
    textLastCommitRef.current = { ...curr }
    setCanUndoText(textHistoryRef.current.length > 0)
    setCanRedoText(false)
  }

  function scheduleTextHistoryPush() {
    if (textDebounceRef.current) clearTimeout(textDebounceRef.current)
    textDebounceRef.current = setTimeout(commitTextHistory, 500)
  }

  function handleTextUndo() {
    if (textDebounceRef.current) { clearTimeout(textDebounceRef.current); textDebounceRef.current = null }
    commitTextHistory()
    if (textHistoryRef.current.length === 0) return
    const prev = textHistoryRef.current[textHistoryRef.current.length - 1]
    textHistoryRef.current = textHistoryRef.current.slice(0, -1)
    textFutureRef.current = [{ ...textLastCommitRef.current }, ...textFutureRef.current]
    setTitle(prev.title)
    setBody(prev.body)
    textCurrentRef.current = { ...prev }
    textLastCommitRef.current = { ...prev }
    setCanUndoText(textHistoryRef.current.length > 0)
    setCanRedoText(true)
  }

  function handleTextRedo() {
    if (textFutureRef.current.length === 0) return
    const next = textFutureRef.current[0]
    textFutureRef.current = textFutureRef.current.slice(1)
    textHistoryRef.current = [...textHistoryRef.current, { ...textLastCommitRef.current }]
    setTitle(next.title)
    setBody(next.body)
    textCurrentRef.current = { ...next }
    textLastCommitRef.current = { ...next }
    setCanUndoText(true)
    setCanRedoText(textFutureRef.current.length > 0)
  }

  const handleSave = useCallback(
    async (data: { title: string; body: string; mood: Mood | null; textColor: string; drawing: string | null }) => {
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
    data: { title, body, mood, textColor, drawing: drawingData },
    onSave: handleSave,
    interval: 30000,
  })

  async function handleTogglePin() {
    if (!savedEntryIdRef.current) return
    const pinning = !isPinned
    try {
      const res = await fetch(`/api/journal/${savedEntryIdRef.current}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: pinning }),
      })
      if (res.ok) {
        setIsPinned(pinning)
      }
    } catch (err) {
      console.error('[JournalEditor] togglePin error:', err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    if (mode === 'draw' && (e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) handleRedo()
      else handleUndo()
    }
    if (mode === 'write' && (e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) handleTextRedo()
      else handleTextUndo()
    }
  }

  const isEmpty = !title.trim() && !body.trim()

  return (
    <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown}>
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E8E2D9]/60 bg-[#FAF8F5]/80 backdrop-blur-md shadow-[var(--shadow-xs)] sticky top-0 z-20">
        <div className="flex items-center gap-2">
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

          {savedEntryIdRef.current && (
            <button
              onClick={handleTogglePin}
              aria-label={isPinned ? 'Unpin entry' : 'Pin entry'}
              title={isPinned ? 'Unpin' : 'Pin'}
              className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] rounded-md p-1 ${isPinned ? 'text-[#7C9E8A]' : 'text-[#B5A99F] hover:text-[#7C9E8A]'}`}
            >
              {isPinned ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M16 1a1 1 0 0 0-2 0v1H10V1a1 1 0 0 0-2 0v1H7a2 2 0 0 0-2 2v1c0 2.97 1.88 5.49 4.5 6.33V20a1 1 0 0 0 2 0v-7.67C14.12 11.49 16 8.97 16 6V5h1V2a1 1 0 0 0-1-1z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
              )}
            </button>
          )}
        </div>

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
              onChange={(e) => {
                const v = e.target.value
                setTitle(v)
                textCurrentRef.current = { ...textCurrentRef.current, title: v }
                scheduleTextHistoryPush()
              }}
              placeholder="Title"
              maxLength={300}
              className="w-full text-5xl bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-[#D4CEC8] leading-tight caret-[#7C9E8A]"
              style={{ color: textColor, fontFamily: 'var(--font-kalam)' }}
              aria-label="Entry title"
            />
          </div>

          {/* Drawing toolbar — relative + z-10 ensures the color picker dropdown
              paints above the drawing canvas (z-2), even though canvas has an
              explicit z-index and the toolbar's backdrop-filter creates a stacking
              context without one */}
          <div className="flex justify-start px-6 py-2 border-b border-[#EAE4DC] relative z-10 overflow-x-auto scrollbar-hide">
            <DrawingToolbar
              mode={mode}
              onModeChange={setMode}
              textColor={textColor}
              onTextColorChange={setTextColor}
              brushColor={brushColor}
              onBrushColorChange={setBrushColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              erasing={erasing}
              onErasingChange={setErasing}
              eraserSize={eraserSize}
              onEraserSizeChange={setEraserSize}
              onClearDrawing={handleClearDrawing}
              canUndo={mode === 'draw' ? canUndo : canUndoText}
              canRedo={mode === 'draw' ? canRedo : canRedoText}
              onUndo={mode === 'draw' ? handleUndo : handleTextUndo}
              onRedo={mode === 'draw' ? handleRedo : handleTextRedo}
            />
          </div>

          {/* Ruled writing area + canvas overlay */}
          <div className="flex-1 px-0 pt-0 pb-8 relative">
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                textCurrentRef.current = { ...textCurrentRef.current, body: e.target.value }
                scheduleTextHistoryPush()
              }}
              placeholder="Start writing..."
              className="ruled-text w-full bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-none placeholder:text-[#D4CEC8] text-[1.35rem] leading-[2.75rem] relative z-[1]"
              style={{
                caretColor: '#7C9E8A',
                minHeight: 'calc(var(--rule-h) * 12)',
                fontFamily: 'var(--font-kalam)',
                color: textColor,
                pointerEvents: mode === 'write' ? 'auto' : 'none',
              }}
              aria-label="Entry body"
              spellCheck
            />
            <DrawingCanvas
              active={mode === 'draw'}
              brushColor={brushColor}
              brushSize={brushSize}
              eraserSize={eraserSize}
              erasing={erasing}
              initialData={drawingData ?? undefined}
              canvasRef={canvasRef}
              sizeRef={bodyRef}
              onChange={handleDrawingChange}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────── */}
      <footer className="sticky bottom-0 flex items-center justify-between px-6 py-3 border-t border-[#E8E2D9]/60 bg-[#FAF8F5]/80 backdrop-blur-md shadow-[0_-2px_8px_rgba(44,40,37,0.06)]">
        <MoodSelector value={mood} onChange={setMood} />
        <WordCount count={wordCount} />
      </footer>
    </div>
  )
}
