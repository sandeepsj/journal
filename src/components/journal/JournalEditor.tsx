import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { MoodSelector } from './MoodSelector'
import { WordCount } from './WordCount'
import { AutoSaveStatus } from './AutoSaveStatus'
import { DrawingCanvas } from './DrawingCanvas'
import { DrawingToolbar } from './DrawingToolbar'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'
import { FormattingToolbar } from './FormattingToolbar'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useWordCount } from '@/hooks/useWordCount'
import { useEntrySync, type FreshEntryData } from '@/hooks/useEntrySync'
import { useEemo } from '@/hooks/useEemo'
import { useAuth } from '@/contexts/AuthContext'
import { createEntry, updateEntry, togglePin as driveTogglePin } from '@/lib/drive'
import { generateAndStoreEmbedding } from '@/lib/embeddings'
import { EemoWidget } from './EemoWidget'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
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
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [isPinned, setIsPinned] = useState(initialPinned)
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [bodyPlainText, setBodyPlainText] = useState('')
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

  const editorRef = useRef<RichTextEditorHandle>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const savedEntryIdRef = useRef<string | null>(entryId ?? null)
  const drawingHistoryRef = useRef<string[]>([])
  const drawingFutureRef = useRef<string[]>([])
  // Plain text ref for embedding generation (avoids stale closure in handleSave)
  const bodyPlainTextRef = useRef('')

  const wordCount = useWordCount(bodyPlainText)
  const { emotion: eemoEmotion, message: eemoMessage, isLoading: eemoLoading } = useEemo(title, bodyPlainText)

  function handleEditorUpdate(html: string) {
    setBody(html)
    const text = editorRef.current?.getText() ?? ''
    setBodyPlainText(text)
    bodyPlainTextRef.current = text
  }

  function handleEditorTransaction() {
    setCanUndoText(editorRef.current?.canUndo() ?? false)
    setCanRedoText(editorRef.current?.canRedo() ?? false)
  }

  // Sync editorWrapperRef from the RichTextEditor handle
  useEffect(() => {
    if (editorRef.current?.wrapperElement) {
      (editorWrapperRef as React.MutableRefObject<HTMLDivElement | null>).current =
        editorRef.current.wrapperElement
    }
  })

  useEffect(() => {
    if (!entryId) editorRef.current?.focus()
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

  function handleDrawingUndo() {
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

  function handleDrawingRedo() {
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

  function handleTextUndo() {
    editorRef.current?.undo()
  }

  function handleTextRedo() {
    editorRef.current?.redo()
  }

  const handleReload = useCallback((data: FreshEntryData) => {
    setTitle(data.title)
    setBody(data.body)
    setMood(data.mood as Mood | null)
    setTextColor(data.textColor)
    setDrawingData(data.drawing)
    drawingHistoryRef.current = []
    drawingFutureRef.current = []
    setCanUndo(false)
    setCanRedo(false)
    // TipTap undo/redo state will reset via content prop sync
  }, [])

  // Ref so handleSave can call notifySaved without a closure dep
  const notifySavedRef = useRef<() => void>(() => {})

  const handleSave = useCallback(
    async (data: { title: string; body: string; mood: Mood | null; textColor: string; drawing: string | null }) => {
      if (!accessToken) throw new Error('Not authenticated')
      const hasContent = data.title.trim() || data.body.trim()
      if (!hasContent) return

      const isNew = !savedEntryIdRef.current

      if (isNew) {
        const result = await createEntry(accessToken, data)
        savedEntryIdRef.current = result.id
      } else {
        await updateEntry(accessToken, savedEntryIdRef.current!, data)
      }
      notifySavedRef.current()

      // Generate embedding from plain text (not HTML)
      const fileId = savedEntryIdRef.current
      if (fileId) {
        const text = `${data.title}\n\n${bodyPlainTextRef.current}`.trim()
        generateAndStoreEmbedding(accessToken, fileId, text).catch((err) =>
          console.error('[JournalEditor] embedding error:', err)
        )
      }
    },
    [accessToken]
  )

  // autoSaveEnabled state lets us pass !isStale to useAutoSave without a circular dep:
  // useAutoSave -> isDirty -> useEntrySync -> isStale -> useAutoSave(enabled)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  const { status, save, isDirty } = useAutoSave({
    data: { title, body, mood, textColor, drawing: drawingData },
    onSave: handleSave,
    interval: 30000,
    enabled: autoSaveEnabled,
  })

  const { isStale, notifySaved, fetchAndReload, dismissStale } = useEntrySync(
    savedEntryIdRef.current,
    isDirty,
    handleReload
  )

  // Keep ref and autoSaveEnabled in sync with resolved values
  useEffect(() => { notifySavedRef.current = notifySaved }, [notifySaved])
  useEffect(() => { setAutoSaveEnabled(!isStale) }, [isStale])

  async function handleTogglePin() {
    if (!savedEntryIdRef.current || !accessToken) return
    const pinning = !isPinned
    try {
      await driveTogglePin(accessToken, savedEntryIdRef.current, pinning)
      setIsPinned(pinning)
    } catch (err) {
      console.error('[JournalEditor] togglePin error:', err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
    // Drawing undo/redo — TipTap handles its own Cmd+Z in write mode
    if (mode === 'draw' && (e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) handleDrawingRedo()
      else handleDrawingUndo()
    }
  }

  const isEmpty = !title.trim() && !bodyPlainText.trim()

  return (
    <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown}>
      {/* -- Top bar ------------------------------------------------- */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md shadow-[var(--shadow-xs)] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md px-1"
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
              className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md p-1 ${isPinned ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'}`}
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

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={save}
            loading={status === 'saving'}
            disabled={isEmpty}
            aria-label="Save entry (Cmd+Enter)"
          >
            <span className="hidden sm:inline mr-1">Save</span>
            <kbd className="text-[10px] text-[var(--color-text-muted)] font-mono bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
              ⌘↵
            </kbd>
          </Button>
        </div>
      </header>

      {/* -- Paper container ------------------------------------------ */}
      <div className="flex-1 flex justify-center px-4 py-8 animate-page-enter">
        <div
          className="ruled-paper w-full max-w-4xl rounded-sm shadow-md flex flex-col"
          style={{ minHeight: 'calc(100vh - 10rem)' }}
        >
          {/* Paper header -- date + title, above the ruled lines */}
          <div className="pt-8 pb-4 pr-6 border-b border-[var(--color-paper-line)]" style={{ paddingLeft: 'calc(var(--rule-margin) + 1.25rem)' }}>
            <p className="text-sm text-[var(--color-text-muted)] mb-4 tabular-nums">
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
              className="w-full text-5xl bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-[var(--color-dot-pattern)] leading-tight caret-[var(--color-accent)]"
              style={{ color: textColor, fontFamily: 'var(--font-kalam)' }}
              aria-label="Entry title"
            />
          </div>

          {/* Stale banner -- shown when another tab saved this entry while this tab has unsaved edits */}
          {isStale && (
            <div className="flex items-center justify-between px-6 py-2 bg-[#FDF6EC] dark:bg-[#2E2210] border-b border-[#F0E0C0] dark:border-[#4A3A1A] text-sm text-[#8B6914] dark:text-[#D4A030]">
              <span>This entry was saved in another tab.</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAndReload}
                  className="font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  Reload
                </button>
                <button
                  onClick={dismissStale}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  Keep mine
                </button>
              </div>
            </div>
          )}

          {/* Drawing toolbar + formatting toolbar */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-[var(--color-paper-line)] relative z-10 gap-3">
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
              onUndo={mode === 'draw' ? handleDrawingUndo : handleTextUndo}
              onRedo={mode === 'draw' ? handleDrawingRedo : handleTextRedo}
            />

            {/* Rich text formatting + quick punctuation in write mode */}
            {mode === 'write' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <FormattingToolbar editorRef={editorRef} />
                <div className="w-px h-5 bg-[var(--color-border)]" />
                <div className="flex items-center gap-1">
                  {['.', ',', '?', '!'].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        editorRef.current?.insertAtCursor(char)
                      }}
                      aria-label={`Insert ${char}`}
                      className="w-8 h-8 rounded-lg text-sm font-mono font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] border border-[var(--color-border)] transition-colors duration-150 flex items-center justify-center"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ruled writing area + canvas overlay */}
          <div className="flex-1 px-0 pt-0 pb-[75vh] relative ruled-lines">
            <div
              className="relative z-[1]"
              style={{ pointerEvents: mode === 'write' ? 'auto' : 'none' }}
            >
              <RichTextEditor
                ref={editorRef}
                content={body}
                onUpdate={handleEditorUpdate}
                onTransaction={handleEditorTransaction}
                textColor={textColor}
                editable={mode === 'write'}
                placeholder="Start writing..."
              />
            </div>
            <DrawingCanvas
              active={mode === 'draw'}
              brushColor={brushColor}
              brushSize={brushSize}
              eraserSize={eraserSize}
              erasing={erasing}
              initialData={drawingData ?? undefined}
              canvasRef={canvasRef}
              sizeRef={editorWrapperRef}
              onChange={handleDrawingChange}
            />
          </div>
        </div>
      </div>

      {/* -- Bottom bar ----------------------------------------------- */}
      <footer className="sticky bottom-0 flex items-center justify-between px-6 py-3 border-t border-[var(--color-border)]/60 bg-[var(--color-bg)]/80 backdrop-blur-md shadow-[var(--shadow-sm)]">
        <MoodSelector value={mood} onChange={setMood} />
        <WordCount count={wordCount} />
      </footer>

      {/* -- Eemo -- fixed to viewport top-right, outside the journal paper -- */}
      <EemoWidget emotion={eemoEmotion} message={eemoMessage} isLoading={eemoLoading} />
    </div>
  )
}
