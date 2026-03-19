'use client'

import { ColorPicker } from './ColorPicker'

export interface DrawingToolbarProps {
  mode: 'write' | 'draw'
  onModeChange: (mode: 'write' | 'draw') => void
  textColor: string
  onTextColorChange: (color: string) => void
  brushColor: string
  onBrushColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  eraserSize: number
  onEraserSizeChange: (size: number) => void
  erasing: boolean
  onErasingChange: (erasing: boolean) => void
  onClearDrawing: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const BRUSH_SIZES = [
  { label: 'Fine',   value: 1.5, dotSize: 4  },
  { label: 'Medium', value: 3,   dotSize: 7  },
  { label: 'Thick',  value: 6,   dotSize: 11 },
]

const ERASER_SIZES = [
  { label: 'Small',  value: 6,  dotSize: 5  },
  { label: 'Medium', value: 14, dotSize: 9  },
  { label: 'Large',  value: 28, dotSize: 14 },
]

export function DrawingToolbar({
  mode,
  onModeChange,
  textColor,
  onTextColorChange,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  eraserSize,
  onEraserSizeChange,
  erasing,
  onErasingChange,
  onClearDrawing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: DrawingToolbarProps) {
  function handleClear() {
    if (window.confirm('Clear all drawings on this page?')) {
      onClearDrawing()
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-paper)]/90 backdrop-blur-sm shadow-[var(--shadow-xs)]"
      role="toolbar"
      aria-label="Editor tools"
    >
      {/* Write / Draw toggle */}
      <div className="flex items-center gap-0.5 rounded-full bg-[var(--color-surface-muted)] p-0.5">
        <button
          onClick={() => onModeChange('write')}
          title="Write mode"
          aria-pressed={mode === 'write'}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ${
            mode === 'write'
              ? 'bg-[var(--color-surface)] shadow-[var(--shadow-xs)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button
          onClick={() => onModeChange('draw')}
          title="Draw mode"
          aria-pressed={mode === 'draw'}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ${
            mode === 'draw'
              ? 'bg-[var(--color-surface)] shadow-[var(--shadow-xs)] text-[var(--color-accent)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
            <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 3-1.8 3-3.02 0-1.67-1.33-3.04-1.5-3.04z" />
          </svg>
        </button>
      </div>

      <div className="w-px h-5 bg-[var(--color-border)]" aria-hidden />

      {/* Write mode — text color */}
      {mode === 'write' && (
        <ColorPicker value={textColor} onChange={onTextColorChange} label="Ink" />
      )}

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" /><path d="M3 13A9 9 0 1 0 5.7 5.7L3 7" />
        </svg>
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
        className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] disabled:hover:bg-transparent disabled:hover:text-[var(--color-text-secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" /><path d="M21 13A9 9 0 1 1 18.3 5.7L21 7" />
        </svg>
      </button>

      {/* Draw mode controls */}
      {mode === 'draw' && (
        <>
          <div className="w-px h-5 bg-[var(--color-border)]" aria-hidden />

          {/* Brush / eraser color + size */}
          {!erasing ? (
            <>
              <ColorPicker value={brushColor} onChange={onBrushColorChange} label="Ink" />

              <div className="w-px h-5 bg-[var(--color-border)]" aria-hidden />

              {/* Brush size */}
              <div className="flex items-center gap-1" role="group" aria-label="Brush size">
                {BRUSH_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onBrushSizeChange(s.value)}
                    title={s.label}
                    aria-pressed={brushSize === s.value}
                    className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-150 ${
                      brushSize === s.value ? 'bg-[var(--color-accent-light)]' : 'hover:bg-[var(--color-surface-muted)]'
                    }`}
                  >
                    <span
                      className="rounded-full"
                      style={{ width: s.dotSize, height: s.dotSize, backgroundColor: brushColor }}
                    />
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Eraser size */
            <div className="flex items-center gap-1" role="group" aria-label="Eraser size">
              <span className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide mr-0.5">
                Size
              </span>
              {ERASER_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onEraserSizeChange(s.value)}
                  title={s.label}
                  aria-pressed={eraserSize === s.value}
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-150 ${
                    eraserSize === s.value ? 'bg-[var(--color-accent-light)]' : 'hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  <span
                    className="rounded-full bg-[var(--color-border)]"
                    style={{ width: s.dotSize, height: s.dotSize }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-5 bg-[var(--color-border)]" aria-hidden />

          {/* Eraser toggle */}
          <button
            onClick={() => onErasingChange(!erasing)}
            title="Eraser"
            aria-pressed={erasing}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ${
              erasing
                ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
          </button>

          {/* Clear all */}
          <button
            onClick={handleClear}
            title="Clear drawing"
            className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
