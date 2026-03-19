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
  const [shownMessage, setShownMessage] = useState<string | null>(null)

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

  // Delay clearing old message so it fades out before new one fades in
  useEffect(() => {
    if (message) {
      setShownMessage(message)
    } else {
      const t = setTimeout(() => setShownMessage(null), 300)
      return () => clearTimeout(t)
    }
  }, [message])

  if (emotion === null) return null

  return (
    <div
      className="absolute right-4 bottom-4 z-10 flex flex-col items-end gap-2"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}
      role="status"
      aria-live="polite"
      aria-label={`Eemo feels ${emotion}${shownMessage ? `: ${shownMessage}` : ''}`}
    >
      {/* Speech bubble — renders above the face, anchored to its right edge */}
      {shownMessage && (
        <div
          className="relative max-w-[180px] rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm"
          style={{
            background: '#FFFDF9',
            border: '1px solid #E8E2D9',
            opacity: message ? 1 : 0,
            transform: message ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.97)',
            transition: prefersReduced
              ? 'none'
              : 'opacity 250ms ease, transform 250ms ease',
          }}
        >
          <p
            className="text-[0.78rem] leading-snug"
            style={{ color: '#4A3F38', fontFamily: 'var(--font-geist-sans, sans-serif)' }}
          >
            {shownMessage}
          </p>
          {/* Tail — small triangle pointing down-right toward Eemo's head */}
          <svg
            className="absolute -bottom-[9px] right-4"
            width="16"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
          >
            <path
              d="M0 0 L8 10 L16 0"
              fill="#FFFDF9"
              stroke="#E8E2D9"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Cover the bottom stroke of the bubble so tail merges cleanly */}
            <line x1="0" y1="0.5" x2="16" y2="0.5" stroke="#FFFDF9" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Eemo face — library used only for drawing, no message prop */}
      <EmotionFace
        emotion={emotion}
        size={72}
        animated={!prefersReduced}
      />
    </div>
  )
}
