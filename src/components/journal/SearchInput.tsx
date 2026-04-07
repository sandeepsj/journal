
import { useRef } from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search entries…',
  onClear,
  className = '',
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 transition-colors duration-150"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
