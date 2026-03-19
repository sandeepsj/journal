'use client'

import { useEffect, useState } from 'react'
import { EmotionFace } from 'react-emotion-face'
import type { Emotion } from 'react-emotion-face'

export interface EemoWidgetProps {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

export function EemoWidget({ emotion, message, isLoading: _isLoading }: EemoWidgetProps) {
  const [visible, setVisible] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Fade in when emotion first appears
  useEffect(() => {
    if (emotion !== null) setVisible(true)
  }, [emotion])

  if (emotion === null) return null

  return (
    <div
      className="absolute right-4 bottom-4 z-10 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      aria-label={`Eemo feels ${emotion}${message ? `: ${message}` : ''}`}
      role="status"
      aria-live="polite"
    >
      <EmotionFace
        emotion={emotion}
        size={80}
        animated={!prefersReduced}
        message={message ?? undefined}
      />
    </div>
  )
}
