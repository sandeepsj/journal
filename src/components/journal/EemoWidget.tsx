'use client'

import { useEffect, useState } from 'react'
import { EmotionFace } from 'react-emotion-face'
import type { Emotion } from 'react-emotion-face'

export interface EemoWidgetProps {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

const W = 200
const H = 195

// Eemo stands outside in the playground — NOT inside the house
const FACE = 46
const FACE_CX = 108  // SVG centre x
const FACE_CY = 148  // SVG centre y (feet near ground line at y=172)

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

  useEffect(() => {
    if (message) {
      setShownMessage(message)
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
    <div
      className="fixed top-14 right-2 z-30"
      style={{ width: W }}
      role="status"
      aria-live="polite"
      aria-label={`Eemo feels ${displayEmotion}${shownMessage ? `: ${shownMessage}` : ''}`}
    >
      {/* ── Speech bubble — above Eemo's face, tail points down ── */}
      {shownMessage && (
        <div
          className="absolute"
          style={{
            bottom: H - FACE_CY + FACE / 2 + 10,
            left: FACE_CX - 90,
            opacity: msgVisible ? 1 : 0,
            transform: msgVisible ? 'translateY(0)' : 'translateY(4px)',
            transition: prefersReduced ? 'none' : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            className="relative rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-sm"
            style={{
              background: '#FFFDF9',
              border: '1px solid #E8E2D9',
              maxWidth: 158,
              minWidth: 90,
            }}
          >
            <p
              className="text-[0.74rem] leading-snug"
              style={{ color: '#4A3F38', fontFamily: 'var(--font-geist-sans, sans-serif)' }}
            >
              {shownMessage}
            </p>
            {/* Down-left pointing tail */}
            <svg
              className="absolute"
              style={{ bottom: -9, left: 14 }}
              width="16" height="10" viewBox="0 0 16 10" fill="none"
            >
              <path d="M0 0 L8 10 L16 0 Z" fill="#FFFDF9" />
              <line x1="0" y1="0.5" x2="16" y2="0.5" stroke="#FFFDF9" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="8" y2="10" stroke="#E8E2D9" strokeWidth="1" />
              <line x1="16" y1="0" x2="8" y2="10" stroke="#E8E2D9" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Scene ── */}
      <div
        className="relative select-none"
        style={{
          filter: isSleeping ? 'saturate(0.45) brightness(0.94)' : 'none',
          transition: prefersReduced ? 'none' : 'filter 700ms ease',
        }}
      >
        <svg
          width={W} height={H}
          viewBox={`0 0 ${W} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── GROUND ── */}
          <path
            d="M2 178 Q45 166 80 173 Q110 178 140 170 Q165 164 198 172 L198 195 L2 195 Z"
            fill="#88C048" opacity="0.4"
          />
          <line x1="2" y1="172" x2="198" y2="172" stroke="#6A9A30" strokeWidth="0.8" opacity="0.3" />

          {/* ── SWING SET (left) ── */}
          {/* A-frame legs */}
          <line x1="8"  y1="88" x2="26" y2="172" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="62" y1="88" x2="44" y2="172" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
          {/* Top crossbar */}
          <line x1="4" y1="86" x2="66" y2="86" stroke="#6B4226" strokeWidth="4" strokeLinecap="round" />
          {/* Ropes */}
          <line x1="24" y1="88" x2="22" y2="136" stroke="#9A7040" strokeWidth="1.8" />
          <line x1="46" y1="88" x2="48" y2="136" stroke="#9A7040" strokeWidth="1.8" />
          {/* Seat */}
          <rect x="16" y="134" width="34" height="6" rx="3" fill="#9A7040" stroke="#6B4226" strokeWidth="1.2" />

          {/* ── DOGHOUSE (right — Tom & Jerry style) ── */}
          {/* Roof */}
          <path d="M145 140 L172 113 L199 140 Z" fill="#C4705A" stroke="#A85A44" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Roof ridge */}
          <line x1="172" y1="113" x2="172" y2="124" stroke="#A85A44" strokeWidth="2" strokeLinecap="round" />
          {/* Roof overhang shadow line */}
          <line x1="145" y1="140" x2="199" y2="140" stroke="#A85A44" strokeWidth="1" opacity="0.5" />

          {/* Body */}
          <rect x="150" y="140" width="44" height="32" rx="2.5" fill="#F2DDA8" stroke="#C49060" strokeWidth="1.5" />
          {/* Plank lines */}
          <line x1="150" y1="150" x2="194" y2="150" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />
          <line x1="150" y1="160" x2="194" y2="160" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />
          <line x1="150" y1="170" x2="194" y2="170" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />

          {/* Entrance hole */}
          <ellipse cx="172" cy="158" rx="12" ry="13" fill="#2A1810" />
          <ellipse cx="172" cy="157" rx="10" ry="11" fill="#1A1008" />

          {/* Name tag */}
          <rect x="161" y="140" width="22" height="7" rx="2" fill="#D4A853" stroke="#B08830" strokeWidth="0.8" />
          <text
            x="172" y="145.5"
            textAnchor="middle"
            fontSize="4.5"
            fill="#5A3810"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            EEMO
          </text>

          {/* ── FLOWERS ── */}
          {/* Left of swing */}
          <line x1="38" y1="172" x2="38" y2="179" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="38" cy="172" r="3"   fill="#FFD740" opacity="0.9" />
          <circle cx="34" cy="168" r="2.5" fill="#FF8FAB" opacity="0.9" />
          <circle cx="42" cy="168" r="2.5" fill="#FF8FAB" opacity="0.9" />
          <circle cx="38" cy="165" r="2.5" fill="#FF8FAB" opacity="0.9" />

          {/* Near doghouse */}
          <line x1="144" y1="172" x2="144" y2="179" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="144" cy="172" r="2.8" fill="#FFD740" opacity="0.9" />
          <circle cx="140" cy="168" r="2.3" fill="#FFAFCC" opacity="0.9" />
          <circle cx="148" cy="168" r="2.3" fill="#FFAFCC" opacity="0.9" />
          <circle cx="144" cy="165" r="2.3" fill="#FFAFCC" opacity="0.9" />
        </svg>

        {/* ── EEMO — standing outside in the playground ── */}
        <div
          style={{
            position: 'absolute',
            left: FACE_CX - FACE / 2,
            top: FACE_CY - FACE / 2,
            width: FACE,
            height: FACE,
          }}
        >
          <EmotionFace
            emotion={displayEmotion}
            size={FACE}
            animated={!prefersReduced}
          />
        </div>
      </div>
    </div>
  )
}
