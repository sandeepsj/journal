export interface DividerProps {
  label?: string
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        <div className="flex-1 border-t border-[var(--color-border)]" />
      </div>
    )
  }

  return <hr className="border-t border-[var(--color-border)]" />
}
