import React from 'react'

export type PageMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface PageWrapperProps {
  children: React.ReactNode
  maxWidth?: PageMaxWidth
  className?: string
  centered?: boolean
}

const maxWidthMap: Record<PageMaxWidth, string> = {
  sm:   'max-w-sm',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  full: 'max-w-none',
}

export function PageWrapper({
  children,
  maxWidth = 'md',
  className = '',
  centered = false,
}: PageWrapperProps) {
  return (
    <main
      className={[
        'min-h-screen px-4 py-8',
        centered ? 'flex items-center justify-center' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${maxWidthMap[maxWidth]} mx-auto w-full animate-page-enter`}>
        {children}
      </div>
    </main>
  )
}
