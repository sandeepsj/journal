import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  id: string
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#2C2825]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full px-3 py-2 text-sm rounded-lg border bg-white text-[#2C2825] placeholder:text-[#B5A99F] transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#7C9E8A] focus:ring-offset-1',
          error
            ? 'border-[#C4614E] focus:ring-[#C4614E]'
            : 'border-[#E8E2D9] hover:border-[#B5A99F]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-[#C4614E]">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="text-xs text-[#B5A99F]">
          {hint}
        </p>
      )}
    </div>
  )
}
