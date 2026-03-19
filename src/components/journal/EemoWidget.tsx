'use client'

import { useEffect, useState } from 'react'
import { EmotionFace } from 'react-emotion-face'
import type { Emotion } from 'react-emotion-face'

export interface EemoWidgetProps {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

// ─────────────────────────────────────────────
// Scene canvas
// ─────────────────────────────────────────────
const W = 200
const H = 195

// ─────────────────────────────────────────────
// Eemo position definitions
// Each position has an id, face centre (cx/cy in SVG coords),
// face size, and a weight for weighted random selection.
//
// Positions:
//   inside       — inside the doghouse, peeking through the entrance
//   peeking      — head poking out the top of the entrance hole
//   on_swing     — sitting on the swing seat
//   playground_a — left area (between swing and centre)
//   playground_b — dead centre of playground (most common)
//   playground_c — right area (between centre and doghouse)
//   playground_d — far-left near swing base
//   on_roof      — perched on the roof peak (very rare)
// ─────────────────────────────────────────────
interface EemoPosition {
  id: string
  cx: number    // face centre x in SVG coordinates
  cy: number    // face centre y in SVG coordinates
  size: number  // EmotionFace size in px
  weight: number
}

const POSITIONS: EemoPosition[] = [
  { id: 'inside',       cx: 172, cy: 152, size: 36, weight: 10 },
  { id: 'peeking',      cx: 172, cy: 136, size: 44, weight: 8  },
  { id: 'on_swing',     cx: 34,  cy: 116, size: 44, weight: 12 },
  { id: 'playground_a', cx: 75,  cy: 144, size: 56, weight: 15 },
  { id: 'playground_b', cx: 108, cy: 144, size: 56, weight: 25 }, // most common
  { id: 'playground_c', cx: 133, cy: 144, size: 56, weight: 15 },
  { id: 'playground_d', cx: 55,  cy: 144, size: 52, weight: 10 },
  { id: 'on_roof',      cx: 172, cy: 100, size: 44, weight: 5  }, // rare
]

// Weighted random — call once per page load
function pickRandomPosition(): EemoPosition {
  const total = POSITIONS.reduce((s, p) => s + p.weight, 0)
  let r = Math.random() * total
  for (const pos of POSITIONS) {
    r -= pos.weight
    if (r <= 0) return pos
  }
  return POSITIONS[4] // fallback: playground_b
}

// ─────────────────────────────────────────────

export function EemoWidget({ emotion, message, isLoading: _isLoading }: EemoWidgetProps) {
  // Position is fixed for the lifetime of this component mount (i.e. one page load)
  const [pos] = useState<EemoPosition>(() => pickRandomPosition())

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

  // Speech bubble floats above the face — centre it over Eemo, clamp to container
  const bubbleLeft = Math.max(4, Math.min(W - 100, pos.cx - 79))
  const bubbleBottom = H - pos.cy + pos.size / 2 + 8

  return (
    <div
      className="fixed top-14 right-2 z-30"
      style={{ width: W, overflow: 'visible' }}
      role="status"
      aria-live="polite"
      aria-label={`Eemo feels ${displayEmotion}${shownMessage ? `: ${shownMessage}` : ''}`}
    >
      {/* ── Speech bubble — above Eemo's face wherever they are ── */}
      {shownMessage && (
        <div
          className="absolute"
          style={{
            bottom: bubbleBottom,
            left: bubbleLeft,
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
            {/* Downward tail — centred under the bubble */}
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
          <line x1="8"  y1="88" x2="26" y2="172" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="62" y1="88" x2="44" y2="172" stroke="#6B4226" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="4"  y1="86" x2="66" y2="86"  stroke="#6B4226" strokeWidth="4"   strokeLinecap="round" />
          <line x1="24" y1="88" x2="22" y2="136" stroke="#9A7040" strokeWidth="1.8" />
          <line x1="46" y1="88" x2="48" y2="136" stroke="#9A7040" strokeWidth="1.8" />
          <rect x="16" y="134" width="34" height="6" rx="3" fill="#9A7040" stroke="#6B4226" strokeWidth="1.2" />

          {/* ── DOGHOUSE (Tom & Jerry style) ── */}
          {/* Roof */}
          <path d="M145 140 L172 113 L199 140 Z" fill="#C4705A" stroke="#A85A44" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="172" y1="113" x2="172" y2="124" stroke="#A85A44" strokeWidth="2" strokeLinecap="round" />
          <line x1="145" y1="140" x2="199" y2="140" stroke="#A85A44" strokeWidth="1" opacity="0.5" />
          {/* Body */}
          <rect x="150" y="140" width="44" height="32" rx="2.5" fill="#F2DDA8" stroke="#C49060" strokeWidth="1.5" />
          <line x1="150" y1="150" x2="194" y2="150" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />
          <line x1="150" y1="160" x2="194" y2="160" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />
          <line x1="150" y1="170" x2="194" y2="170" stroke="#C49060" strokeWidth="0.7" opacity="0.45" />
          {/* Entrance */}
          <ellipse cx="172" cy="158" rx="12" ry="13" fill="#2A1810" />
          <ellipse cx="172" cy="157" rx="10" ry="11" fill="#1A1008" />
          {/* Name tag */}
          <rect x="161" y="140" width="22" height="7" rx="2" fill="#D4A853" stroke="#B08830" strokeWidth="0.8" />
          <text x="172" y="145.5" textAnchor="middle" fontSize="4.5" fill="#5A3810" fontFamily="sans-serif" fontWeight="bold">EEMO</text>

          {/* ── FLOWERS ── */}
          <line x1="38" y1="172" x2="38" y2="179" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="38" cy="172" r="3"   fill="#FFD740" opacity="0.9" />
          <circle cx="34" cy="168" r="2.5" fill="#FF8FAB" opacity="0.9" />
          <circle cx="42" cy="168" r="2.5" fill="#FF8FAB" opacity="0.9" />
          <circle cx="38" cy="165" r="2.5" fill="#FF8FAB" opacity="0.9" />

          <line x1="144" y1="172" x2="144" y2="179" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="144" cy="172" r="2.8" fill="#FFD740" opacity="0.9" />
          <circle cx="140" cy="168" r="2.3" fill="#FFAFCC" opacity="0.9" />
          <circle cx="148" cy="168" r="2.3" fill="#FFAFCC" opacity="0.9" />
          <circle cx="144" cy="165" r="2.3" fill="#FFAFCC" opacity="0.9" />
        </svg>

        {/* ── EEMO — positioned at the randomly chosen spot ── */}
        <div
          style={{
            position: 'absolute',
            left: pos.cx - pos.size / 2,
            top: pos.cy - pos.size / 2,
            width: pos.size,
            height: pos.size,
          }}
        >
          <EmotionFace
            emotion={displayEmotion}
            size={pos.size}
            animated={!prefersReduced}
          />
        </div>
      </div>
    </div>
  )
}
