export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutoSaveStatusProps {
  status: SaveStatus
}

const config: Record<SaveStatus, { label: string; color: string }> = {
  idle:   { label: '',        color: 'text-transparent' },
  saving: { label: 'Saving…', color: 'text-[#B5A99F]' },
  saved:  { label: 'Saved',   color: 'text-[#6A9B77]' },
  error:  { label: 'Failed to save', color: 'text-[#C4614E]' },
}

export function AutoSaveStatus({ status }: AutoSaveStatusProps) {
  const { label, color } = config[status]

  return (
    <p
      className={`text-xs transition-all duration-300 ${color}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {label || '\u00A0' /* non-breaking space keeps height stable */}
    </p>
  )
}
