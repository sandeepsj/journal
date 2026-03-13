import React from 'react'
import { LoadingDots } from './LoadingDots'

export type ButtonVariant = 'primary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#7C9E8A] text-white hover:bg-[#6a8f7a] border border-transparent shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-accent)] active:translate-y-px active:shadow-none',
  ghost:
    'bg-transparent text-[#2C2825] hover:bg-[#F2EEE8] border border-[#E8E2D9]',
  danger:
    'bg-transparent text-[#C4614E] hover:bg-[#fff0ed] border border-[#C4614E]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium transition-[colors,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? <LoadingDots size="sm" /> : children}
    </button>
  )
}
