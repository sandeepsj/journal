'use client'

import { useEffect, useState } from 'react'
import { EmotionFace } from 'react-emotion-face'
import type { Emotion } from 'react-emotion-face'

export interface EemoWidgetProps {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

// House dimensions
const BODY_W = 84
const ROOF_W = 100
const ROOF_H = 30

export function EemoWidget({ emotion, message, isLoading: _isLoading }: EemoWidgetProps) {
  const [prefersReduced, setPrefersReduced] = useState(false)
  const [shownMessage, setShownMessage] = useState<string | null>(null)
  const [msgVisible, setMsgVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Animate message in/out
  useEffect(() => {
    if (message) {
      setShownMessage(message)
      // Small delay so the element mounts before opacity transitions
      const t = setTimeout(() => setMsgVisible(true), 20)
      return () => clearTimeout(t)
    } else {
      setMsgVisible(false)
      const t = setTimeout(() => setShownMessage(null), 280)
      return () => clearTimeout(t)
    }
  }, [message])

  const isSleeping = emotion === null
  const displayEmotion: Emotion = emotion ?? 'sleepy'

  return (
    /*
     * Fixed to viewport — top-right, just below the sticky header.
     * On desktop this lands outside the journal paper.
     * On narrow screens it shrinks via the sm: prefix if needed.
     */
    <div
      className="fixed top-16 right-4 z-30 flex flex-col items-center"
      role="status"
      aria-live="polite"
      aria-label={`Eemo feels ${displayEmotion}${shownMessage ? `: ${shownMessage}` : ''}`}
    >
      {/* ── Speech bubble — floats to the left of the house ── */}
      {shownMessage && (
        <div
          className="absolute"
          style={{
            // Align bubble vertically with the middle of the house body
            top: ROOF_H + 10,
            // Place to the left of the house with a gap for the tail
            right: ROOF_W / 2 + BODY_W / 2 + 14,
            opacity: msgVisible ? 1 : 0,
            transform: msgVisible ? 'translateX(0)' : 'translateX(8px)',
            transition: prefersReduced ? 'none' : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: 'none',
          }}
        >
          <div
            className="relative max-w-[172px] rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-sm whitespace-normal"
            style={{
              background: '#FFFDF9',
              border: '1px solid #E8E2D9',
              minWidth: 100,
            }}
          >
            <p
              className="text-[0.75rem] leading-snug"
              style={{ color: '#4A3F38', fontFamily: 'var(--font-geist-sans, sans-serif)' }}
            >
              {shownMessage}
            </p>

            {/* Right-pointing tail */}
            <svg
              className="absolute"
              style={{ top: 10, right: -10 }}
              width="11"
              height="16"
              viewBox="0 0 11 16"
              fill="none"
            >
              <path
                d="M0 0 L11 8 L0 16 Z"
                fill="#FFFDF9"
              />
              {/* left edge matches bubble border */}
              <line x1="0.5" y1="0" x2="0.5" y2="16" stroke="#E8E2D9" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}

      {/* ── House ── */}
      <div
        style={{
          filter: isSleeping
            ? 'saturate(0.55) brightness(0.97)'
            : 'saturate(1) brightness(1)',
          transition: prefersReduced ? 'none' : 'filter 600ms ease',
        }}
      >
        {/* Roof */}
        <svg
          width={ROOF_W}
          height={ROOF_H}
          viewBox={`0 0 ${ROOF_W} ${ROOF_H}`}
          fill="none"
          style={{ display: 'block' }}
        >
          {/* Main roof triangle */}
          <path
            d={`M${ROOF_W / 2} 2 L${ROOF_W - 2} ${ROOF_H} L2 ${ROOF_H} Z`}
            fill="#B8A898"
            stroke="#A89486"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Subtle ridge line */}
          <line
            x1={ROOF_W / 2}
            y1="2"
            x2={ROOF_W / 2}
            y2={ROOF_H * 0.55}
            stroke="#A89486"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Tiny chimney */}
          <rect
            x={ROOF_W / 2 + 10}
            y="0"
            width="8"
            height="12"
            rx="1.5"
            fill="#A89486"
            stroke="#9A8070"
            strokeWidth="1"
          />
        </svg>

        {/* House body */}
        <div
          style={{
            width: BODY_W,
            marginLeft: (ROOF_W - BODY_W) / 2,
            background: '#FAF8F5',
            border: '1.5px solid #E0D8CF',
            borderTop: 'none',
            borderRadius: '0 0 14px 14px',
            boxShadow: '0 4px 14px rgba(44,40,37,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 10,
          }}
        >
          <EmotionFace
            emotion={displayEmotion}
            size={58}
            animated={!prefersReduced && !isSleeping}
          />

          {/* Small door — decorative */}
          <div
            style={{
              marginTop: 6,
              width: 16,
              height: 10,
              borderRadius: '8px 8px 0 0',
              background: '#D4CBC2',
              border: '1px solid #C4B5A5',
            }}
          />
        </div>
      </div>
    </div>
  )
}
