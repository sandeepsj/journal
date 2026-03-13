import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  glass?: boolean
  as?: 'div' | 'article' | 'section'
}

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  glass = false,
  as: Tag = 'div',
}: CardProps) {
  const interactive = hoverable || !!onClick

  return (
    <Tag
      onClick={onClick}
      className={[
        glass ? 'glass border rounded-xl p-5' : 'bg-white border border-[#E8E2D9] rounded-xl p-5',
        'shadow-[var(--shadow-xs)]',
        interactive
          ? 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[#B5A99F] cursor-pointer'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </Tag>
  )
}
