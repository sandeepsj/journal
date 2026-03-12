import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  as?: 'div' | 'article' | 'section'
}

export function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  as: Tag = 'div',
}: CardProps) {
  const interactive = hoverable || !!onClick

  return (
    <Tag
      onClick={onClick}
      className={[
        'bg-white border border-[#E8E2D9] rounded-xl p-5',
        interactive
          ? 'transition-all duration-150 hover:shadow-md hover:border-[#B5A99F] cursor-pointer'
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
