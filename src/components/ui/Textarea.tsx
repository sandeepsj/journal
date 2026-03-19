import React from 'react'

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  error?: string
  hint?: string
  id: string
  value: string
  onChange: (value: string) => void
  showCount?: boolean
  maxLength?: number
}

export function Textarea({
  label,
  error,
  hint,
  id,
  value,
  onChange,
  showCount = false,
  maxLength,
  className = '',
  rows = 4,
  ...props
}: TextareaProps) {
  const atLimit = maxLength !== undefined && value.length >= maxLength

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-y transition-[colors,box-shadow] duration-150',
          'hover:shadow-[var(--shadow-xs)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:ring-offset-0',
          error
            ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/40'
            : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      <div className="flex justify-between items-start">
        <div>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-error)]">
              {error}
            </p>
          )}
          {!error && hint && (
            <p id={`${id}-hint`} className="text-xs text-[var(--color-text-muted)]">
              {hint}
            </p>
          )}
        </div>
        {showCount && maxLength !== undefined && (
          <p className={`text-xs tabular-nums ${atLimit ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
