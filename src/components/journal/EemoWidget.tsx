'use client'

import { useEffect, useState } from 'react'
import { EmotionFace } from 'react-emotion-face'
import type { Emotion } from 'react-emotion-face'

export interface EemoWidgetProps {
  emotion: Emotion | null
  message: string | null
  isLoading: boolean
}

// Scene canvas
const W = 260
const H = 258

// Eemo face sits inside the circular window
const FACE = 52
const WIN_CX = 151  // window centre x in SVG coords
const WIN_CY = 152  // window centre y in SVG coords

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
      className="fixed top-14 right-2 z-30 origin-top-right scale-90 sm:scale-100"
      style={{ width: W }}
      role="status"
      aria-live="polite"
      aria-label={`Eemo feels ${displayEmotion}${shownMessage ? `: ${shownMessage}` : ''}`}
    >
      {/* ── Speech bubble — floats left of the scene ── */}
      {shownMessage && (
        <div
          className="absolute"
          style={{
            top: WIN_CY - 16,
            right: 'calc(100% + 10px)',
            opacity: msgVisible ? 1 : 0,
            transform: msgVisible ? 'translateX(0)' : 'translateX(6px)',
            transition: prefersReduced ? 'none' : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            className="relative rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-sm"
            style={{
              background: '#FFFDF9',
              border: '1px solid #E8E2D9',
              maxWidth: 164,
              minWidth: 96,
            }}
          >
            <p
              className="text-[0.74rem] leading-snug"
              style={{ color: '#4A3F38', fontFamily: 'var(--font-geist-sans, sans-serif)' }}
            >
              {shownMessage}
            </p>
            <svg
              className="absolute"
              style={{ top: 10, right: -10 }}
              width="11" height="16" viewBox="0 0 11 16" fill="none"
            >
              <path d="M0 0 L11 8 L0 16 Z" fill="#FFFDF9" />
              <line x1="0.5" y1="0" x2="0.5" y2="16" stroke="#E8E2D9" strokeWidth="1" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Illustrated scene ── */}
      <div
        className="relative select-none"
        style={{
          filter: isSleeping ? 'saturate(0.5) brightness(0.95)' : 'none',
          transition: prefersReduced ? 'none' : 'filter 700ms ease',
        }}
      >
        <svg
          width={W} height={H}
          viewBox={`0 0 ${W} ${H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >

          {/* ════════════════════════════════════════
              PLAYGROUND — SWING SET  (left side)
          ════════════════════════════════════════ */}
          {/* A-frame legs */}
          <line x1="10" y1="148" x2="43" y2="224" stroke="#6B4226" strokeWidth="4" strokeLinecap="round" />
          <line x1="76" y1="148" x2="43" y2="224" strokeWidth="4" stroke="#6B4226" strokeLinecap="round" />
          {/* Cross brace */}
          <line x1="25" y1="178" x2="61" y2="178" stroke="#6B4226" strokeWidth="2.5" strokeLinecap="round" />
          {/* Top crossbar */}
          <line x1="6"  y1="146" x2="80" y2="146" stroke="#6B4226" strokeWidth="4.5" strokeLinecap="round" />
          {/* Ropes */}
          <line x1="28" y1="148" x2="24" y2="200" stroke="#9A7040" strokeWidth="2" />
          <line x1="58" y1="148" x2="62" y2="200" stroke="#9A7040" strokeWidth="2" />
          {/* Seat */}
          <rect x="18" y="198" width="50" height="8" rx="4" fill="#9A7040" stroke="#6B4226" strokeWidth="1.5" />

          {/* ════════════════════════════════════════
              PLAYGROUND — SLIDE  (right of hut)
          ════════════════════════════════════════ */}
          {/* Platform at top (attaches to right wall of hut at x=210) */}
          <rect x="205" y="116" width="14" height="6" rx="2" fill="#C07820" />
          {/* Slide ramp surface */}
          <polygon points="205,122 215,122 253,220 243,220" fill="#F5A623" />
          {/* Slide left rail */}
          <line x1="205" y1="116" x2="243" y2="222" stroke="#C07820" strokeWidth="2.5" strokeLinecap="round" />
          {/* Slide right rail */}
          <line x1="215" y1="116" x2="253" y2="222" stroke="#C07820" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bottom support cross */}
          <line x1="243" y1="222" x2="253" y2="222" stroke="#C07820" strokeWidth="3" strokeLinecap="round" />
          <line x1="248" y1="222" x2="248" y2="162" stroke="#C07820" strokeWidth="3" strokeLinecap="round" />
          {/* Ladder (left side of slide) */}
          <line x1="203" y1="122" x2="203" y2="160" stroke="#C07820" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="213" y1="122" x2="213" y2="160" stroke="#C07820" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="203" y1="133" x2="213" y2="133" stroke="#C07820" strokeWidth="2" />
          <line x1="203" y1="146" x2="213" y2="146" stroke="#C07820" strokeWidth="2" />

          {/* ════════════════════════════════════════
              GROUND
          ════════════════════════════════════════ */}
          <path
            d="M2 234 Q40 220 72 228 Q100 234 130 224 Q160 216 190 228 Q214 236 258 226 L258 258 L2 258 Z"
            fill="#88C048" opacity="0.45"
          />
          <ellipse cx="130" cy="232" rx="124" ry="12" fill="#9DC854" opacity="0.22" />

          {/* ─ Flowers ─ */}
          {/* Left cluster */}
          <line x1="43" y1="225" x2="43" y2="234" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="43" cy="225" r="3.5" fill="#FFD740" opacity="0.9" />
          <circle cx="39" cy="221" r="3"   fill="#FF8FAB" opacity="0.9" />
          <circle cx="47" cy="221" r="3"   fill="#FF8FAB" opacity="0.9" />
          <circle cx="43" cy="218" r="3"   fill="#FF8FAB" opacity="0.9" />

          <line x1="68" y1="228" x2="68" y2="236" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="68" cy="228" r="3"   fill="#FFD740" opacity="0.85" />
          <circle cx="64" cy="224" r="2.5" fill="#FFAFCC" opacity="0.85" />
          <circle cx="72" cy="224" r="2.5" fill="#FFAFCC" opacity="0.85" />
          <circle cx="68" cy="221" r="2.5" fill="#FFAFCC" opacity="0.85" />

          {/* Right cluster */}
          <line x1="222" y1="228" x2="222" y2="236" stroke="#4A8C20" strokeWidth="1.5" />
          <circle cx="222" cy="228" r="3.5" fill="#FFD740" opacity="0.9" />
          <circle cx="218" cy="224" r="3"   fill="#FF8FAB" opacity="0.9" />
          <circle cx="226" cy="224" r="3"   fill="#FF8FAB" opacity="0.9" />
          <circle cx="222" cy="221" r="3"   fill="#FF8FAB" opacity="0.9" />

          {/* ════════════════════════════════════════
              HUT — WALLS  x:88–210, y:108–230
          ════════════════════════════════════════ */}
          {/* Main wall body — warm clay */}
          <rect x="88" y="108" width="122" height="122" rx="5" fill="#D6A870" />
          {/* Horizontal plank lines */}
          <line x1="88" y1="124" x2="210" y2="124" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="140" x2="210" y2="140" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="156" x2="210" y2="156" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="172" x2="210" y2="172" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="188" x2="210" y2="188" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="204" x2="210" y2="204" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          <line x1="88" y1="220" x2="210" y2="220" stroke="#BE9055" strokeWidth="0.9" opacity="0.45" />
          {/* Vertical corner details */}
          <line x1="104" y1="108" x2="104" y2="230" stroke="#BE9055" strokeWidth="0.9" opacity="0.25" />
          <line x1="196" y1="108" x2="196" y2="230" stroke="#BE9055" strokeWidth="0.9" opacity="0.25" />

          {/* ════════════════════════════════════════
              HUT — CHIMNEY
          ════════════════════════════════════════ */}
          <rect x="167" y="36" width="18" height="46" rx="3" fill="#C4705A" stroke="#A85A44" strokeWidth="1.2" />
          {/* Brick courses */}
          <line x1="167" y1="47" x2="185" y2="47" stroke="#A85A44" strokeWidth="0.8" opacity="0.55" />
          <line x1="167" y1="57" x2="185" y2="57" stroke="#A85A44" strokeWidth="0.8" opacity="0.55" />
          <line x1="167" y1="67" x2="185" y2="67" stroke="#A85A44" strokeWidth="0.8" opacity="0.55" />
          <line x1="176" y1="36" x2="176" y2="82" stroke="#A85A44" strokeWidth="0.7" opacity="0.35" />
          {/* Cap */}
          <rect x="163" y="34" width="26" height="7" rx="2.5" fill="#A85A44" />
          {/* Smoke — only when awake */}
          {!isSleeping && <>
            <path d="M171 34 Q166 25 171 17 Q176 9 171 2"  stroke="#D4CEC8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M177 34 Q182 26 177 18 Q172 11 177 4" stroke="#D4CEC8" strokeWidth="2"   strokeLinecap="round" fill="none" opacity="0.4" />
          </>}

          {/* ════════════════════════════════════════
              HUT — THATCHED ROOF  (layered bands)
          ════════════════════════════════════════ */}
          {/* Band 1 — bottom/widest overhang */}
          <path d="M78 118 Q149 102 220 118 L220 131 Q149 116 78 131 Z"  fill="#A86B14" />
          <path d="M78 128 Q149 115 220 128" stroke="#8A5210" strokeWidth="0.6" fill="none" opacity="0.35" />

          {/* Band 2 */}
          <path d="M84 103 Q149 88 214 103 L214 117 Q149 103 84 117 Z"   fill="#B87820" />
          <path d="M84 113 Q149 100 214 113" stroke="#9A6218" strokeWidth="0.6" fill="none" opacity="0.35" />

          {/* Band 3 */}
          <path d="M91 88  Q149 74 207 88  L207 102 Q149 89 91 102 Z"    fill="#C8902C" />
          <path d="M91 98  Q149 86 207 98"  stroke="#A87020" strokeWidth="0.6" fill="none" opacity="0.35" />

          {/* Band 4 */}
          <path d="M99 74  Q149 61 199 74  L199 88  Q149 76 99 88  Z"    fill="#D4A034" />
          <path d="M99 84  Q149 73 199 84"  stroke="#B0801E" strokeWidth="0.6" fill="none" opacity="0.35" />

          {/* Band 5 */}
          <path d="M108 60 Q149 48 190 60 L190 74 Q149 62 108 74 Z"      fill="#DCAC3C" />
          <path d="M108 70 Q149 59 190 70"  stroke="#B8921E" strokeWidth="0.6" fill="none" opacity="0.35" />

          {/* Band 6 */}
          <path d="M119 47 Q149 36 179 47 L179 61 Q149 51 119 61 Z"      fill="#E4B844" />

          {/* Peak cap */}
          <path d="M131 44 Q149 30 167 44 L167 50 Q149 37 131 50 Z"      fill="#ECBf50" />
          <path d="M138 42 Q149 32 160 42" stroke="#C89A28" strokeWidth="1" fill="none" opacity="0.5" />

          {/* ════════════════════════════════════════
              HUT — ROUND WINDOW  (Eemo peeks out)
          ════════════════════════════════════════ */}
          {/* Outer sill ring */}
          <circle cx={WIN_CX} cy={WIN_CY} r="35" fill="#E8D0A8" stroke="#8B5E3C" strokeWidth="2.5" />
          {/* Inner pane */}
          <circle cx={WIN_CX} cy={WIN_CY} r="31" fill="#FFF8EE" />
          {/* Cross frame */}
          <line x1={WIN_CX - 31} y1={WIN_CY} x2={WIN_CX + 31} y2={WIN_CY} stroke="#8B5E3C" strokeWidth="1.8" />
          <line x1={WIN_CX} y1={WIN_CY - 31} x2={WIN_CX} y2={WIN_CY + 31} stroke="#8B5E3C" strokeWidth="1.8" />
          {/* Window sill ledge */}
          <rect x={WIN_CX - 37} y={WIN_CY + 27} width="74" height="9" rx="3.5" fill="#C49060" stroke="#A07040" strokeWidth="1" />
          {/* Small flower pot on sill */}
          <rect x={WIN_CX + 22} y={WIN_CY + 28} width="9" height="7"  rx="1.5" fill="#C4705A" />
          <ellipse cx={WIN_CX + 26} cy={WIN_CY + 28} rx="5" ry="3" fill="#88C048" />
          <circle  cx={WIN_CX + 26} cy={WIN_CY + 26} r="2.5" fill="#FF8FAB" />

          {/* ════════════════════════════════════════
              HUT — ARCHED DOOR
          ════════════════════════════════════════ */}
          {/* Frame */}
          <path d="M168 230 L168 181 Q168 166 181 166 Q194 166 194 181 L194 230 Z" fill="#7A4E2D" />
          {/* Inner panel */}
          <path d="M171 230 L171 182 Q171 170 181 170 Q191 170 191 182 L191 230 Z" fill="#9A6A3C" />
          {/* Top arch shine */}
          <path d="M171 182 Q181 170 191 182" stroke="#B07A4C" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Door panels */}
          <line x1="171" y1="196" x2="191" y2="196" stroke="#7A4E2D" strokeWidth="1"   opacity="0.5" />
          <line x1="181" y1="170" x2="181" y2="196" stroke="#7A4E2D" strokeWidth="1"   opacity="0.5" />
          {/* Door knob */}
          <circle cx="188" cy="205" r="3.2" fill="#D4A853" stroke="#B08830" strokeWidth="0.8" />

        </svg>

        {/* ── EEMO FACE — overlaid exactly on the window ── */}
        <div
          style={{
            position: 'absolute',
            left: WIN_CX - FACE / 2,
            top:  WIN_CY - FACE / 2,
            width: FACE,
            height: FACE,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EmotionFace
            emotion={displayEmotion}
            size={FACE}
            animated={!prefersReduced && !isSleeping}
          />
        </div>
      </div>
    </div>
  )
}
