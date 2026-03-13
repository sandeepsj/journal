'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Trap focus and handle Escape
  useEffect(() => {
    if (!isOpen) return

    const prev = document.activeElement as HTMLElement
    dialogRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2C2825]/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative bg-white/90 backdrop-blur-md border border-[#E8E2D9] rounded-2xl shadow-[var(--shadow-xl)] w-full ${sizeMap[size]} animate-scale-in focus:outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E8E2D9]">
            <h2 id="modal-title" className="font-serif text-lg text-[#2C2825]">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[#B5A99F] hover:text-[#2C2825] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] rounded-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}
