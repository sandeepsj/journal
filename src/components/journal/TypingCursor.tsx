export interface TypingCursorProps {
  visible?: boolean
  color?: string
}

export function TypingCursor({ visible = true, color = '#7C9E8A' }: TypingCursorProps) {
  if (!visible) return null

  return (
    <span
      aria-hidden="true"
      className="inline-block w-0.5 h-[1.1em] rounded-sm align-text-bottom animate-cursor-blink ml-0.5"
      style={{ backgroundColor: color }}
    />
  )
}
