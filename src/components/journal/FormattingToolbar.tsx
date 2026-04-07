import { useState, useEffect, type RefObject } from 'react'
import type { RichTextEditorHandle } from './RichTextEditor'

export interface FormattingToolbarProps {
  editorRef: RefObject<RichTextEditorHandle | null>
}

export function FormattingToolbar({ editorRef }: FormattingToolbarProps) {
  // Force re-render on selection/transaction changes to update active states
  const [, setTick] = useState(0)

  useEffect(() => {
    // The parent's onTransaction triggers state updates that cause this to re-render.
    // We also listen for selectionchange for more responsive active-state feedback.
    const handler = () => setTick((t) => t + 1)
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [])

  const editor = editorRef.current
  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false

  const btnBase =
    'w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center border'
  const btnInactive =
    'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] border-[var(--color-border)]'
  const btnActive =
    'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'

  return (
    <div className="flex items-center gap-1">
      {/* Bold */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          editor?.toggleBold()
        }}
        aria-label="Bold"
        title="Bold (Cmd+B)"
        className={`${btnBase} ${isActive('bold') ? btnActive : btnInactive}`}
      >
        <span className="font-bold">B</span>
      </button>

      {/* Italic */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          editor?.toggleItalic()
        }}
        aria-label="Italic"
        title="Italic (Cmd+I)"
        className={`${btnBase} ${isActive('italic') ? btnActive : btnInactive}`}
      >
        <span className="italic">I</span>
      </button>

      {/* Heading 2 */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          editor?.toggleHeading(2)
        }}
        aria-label="Heading"
        title="Heading"
        className={`${btnBase} ${isActive('heading', { level: 2 }) ? btnActive : btnInactive}`}
      >
        <span className="text-xs font-semibold">H</span>
      </button>

      {/* Bullet list */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          editor?.toggleBulletList()
        }}
        aria-label="Bullet list"
        title="Bullet list"
        className={`${btnBase} ${isActive('bulletList') ? btnActive : btnInactive}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Ordered list */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          editor?.toggleOrderedList()
        }}
        aria-label="Numbered list"
        title="Numbered list"
        className={`${btnBase} ${isActive('orderedList') ? btnActive : btnInactive}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="6" x2="20" y2="6" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <line x1="10" y1="18" x2="20" y2="18" />
          <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
          <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
          <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
        </svg>
      </button>
    </div>
  )
}
