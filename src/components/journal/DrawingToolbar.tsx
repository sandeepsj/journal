'use client'

export interface DrawingToolbarProps {
  mode: 'write' | 'draw'
  onModeChange: (mode: 'write' | 'draw') => void
  textColor: string
  onTextColorChange: (color: string) => void
  brushColor: string
  onBrushColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  erasing: boolean
  onErasingChange: (erasing: boolean) => void
  onClearDrawing: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const BRUSH_SIZES = [
  { label: 'Fine', value: 1.5, dotSize: 4 },
  { label: 'Medium', value: 3, dotSize: 7 },
  { label: 'Thick', value: 6, dotSize: 11 },
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8E2D9] bg-[#FEFCF8]/90 backdrop-blur-sm shadow-[var(--shadow-xs)]"
      role="toolbar"
      aria-label="Editor tools"
    >
      {/* Write / Draw toggle */}
      <div className="flex items-center gap-0.5 rounded-full bg-[#F2EEE8] p-0.5">
        <button
          onClick={() => onModeChange('write')}
          title="Write mode"
          aria-pressed={mode === 'write'}
          className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ${
            mode === 'write'
              ? 'bg-white shadow-[var(--shadow-xs)] text-[#7C9E8A]'
              : 'text-[#8B7D72] hover:text-[#2C2825]'
          }`}
        >
          {/* Pencil icon */}
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
              ? 'bg-white shadow-[var(--shadow-xs)] text-[#7C9E8A]'
              : 'text-[#8B7D72] hover:text-[#2C2825]'
          }`}
        >
          {/* Brush icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
            <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 3-1.8 3-3.02 0-1.67-1.33-3.04-1.5-3.04z" />
          </svg>
        </button>
      </div>

      <div className="w-px h-5 bg-[#E8E2D9]" aria-hidden />

      {/* Text color picker — Write mode only */}
      {mode === 'write' && (
        <label className="flex items-center gap-1.5 cursor-pointer" title="Text color">
          <span className="text-[10px] text-[#8B7D72] font-medium uppercase tracking-wide">Ink</span>
          <span
            className="block w-5 h-5 rounded-full border-2 border-white shadow-[var(--shadow-xs)] ring-1 ring-[#E8E2D9]"
            style={{ backgroundColor: textColor }}
          />
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="sr-only"
            aria-label="Text color"
          />
        </label>
      )}

      {/* Draw mode controls */}
      {mode === 'draw' && (
        <>
          {/* Brush color */}
          <label className="flex items-center gap-1.5 cursor-pointer" title="Brush color">
            <span className="text-[10px] text-[#8B7D72] font-medium uppercase tracking-wide">Ink</span>
            <span
              className="block w-5 h-5 rounded-full border-2 border-white shadow-[var(--shadow-xs)] ring-1 ring-[#E8E2D9]"
              style={{ backgroundColor: erasing ? '#D4CEC8' : brushColor }}
            />
            <input
              type="color"
              value={brushColor}
              onChange={(e) => { onBrushColorChange(e.target.value); onErasingChange(false) }}
              className="sr-only"
              aria-label="Brush color"
            />
          </label>

          <div className="w-px h-5 bg-[#E8E2D9]" aria-hidden />

          {/* Brush size presets */}
          <div className="flex items-center gap-1" role="group" aria-label="Brush size">
            {BRUSH_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => onBrushSizeChange(s.value)}
                title={s.label}
                aria-pressed={brushSize === s.value}
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-150 ${
                  brushSize === s.value && !erasing
                    ? 'bg-[#EAF1EC]'
                    : 'hover:bg-[#F2EEE8]'
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: s.dotSize, height: s.dotSize, color: brushColor }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#E8E2D9]" aria-hidden />

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-[#8B7D72] hover:text-[#2C2825] hover:bg-[#F2EEE8] disabled:hover:bg-transparent disabled:hover:text-[#8B7D72]"
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
            className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed text-[#8B7D72] hover:text-[#2C2825] hover:bg-[#F2EEE8] disabled:hover:bg-transparent disabled:hover:text-[#8B7D72]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" /><path d="M21 13A9 9 0 1 1 18.3 5.7L21 7" />
            </svg>
          </button>

          <div className="w-px h-5 bg-[#E8E2D9]" aria-hidden />

          {/* Eraser */}
          <button
            onClick={() => onErasingChange(!erasing)}
            title="Eraser"
            aria-pressed={erasing}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ${
              erasing ? 'bg-[#EAF1EC] text-[#7C9E8A]' : 'text-[#8B7D72] hover:text-[#2C2825] hover:bg-[#F2EEE8]'
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
            className="flex items-center justify-center w-7 h-7 rounded-full text-[#C4614E] hover:bg-[#FDF0EE] transition-colors duration-150"
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
