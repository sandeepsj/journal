'use client'

import { useState, useRef, useEffect } from 'react'

// ── Calming quick-pick palette ──────────────────────────────────
export const CALMING_COLORS = [
  // Darks / near-blacks
  '#2C2825', '#4A3F3A',
  // Earth / stone
  '#8B7D72', '#B5A99F', '#C4A882', '#D4CEC8',
  // Sage / forest greens
  '#7C9E8A', '#9DB5A4', '#6A9B77', '#A8C5A0',
  // Slate / dusty blues
  '#6B8FA8', '#7B9BAF', '#8FA8B8', '#A0BCC8',
  // Lavender / soft purple
  '#9B8EAF', '#B0A0C0',
  // Terracotta / warm tones
  '#C4614E', '#D4846E', '#C47E5E', '#E8B89A',
]

// ── HSV ↔ Hex helpers ───────────────────────────────────────────
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = h * 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60)       { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) {        g = c; b = x }
  else if (h < 240) {        g = x; b = c }
  else if (h < 300) { r = x;        b = c }
  else              { r = c;        b = x }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isValidHex(s: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(s)
}

// ── Component ───────────────────────────────────────────────────
export interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const safe = isValidHex(value) ? value : '#2C2825'
  const init = hexToHsv(safe)

  const [open, setOpen] = useState(false)
  const [hue, setHue] = useState(init.h)
  const [sat, setSat] = useState(init.s)
  const [val, setVal] = useState(init.v)
  const [hexInput, setHexInput] = useState(safe)

  const containerRef = useRef<HTMLDivElement>(null)
  const gradRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)

  // Sync internal state when value changes externally (not from our own onChange)
  useEffect(() => {
    if (!isValidHex(value)) return
    const current = hsvToHex(hue, sat, val)
    if (value.toLowerCase() !== current.toLowerCase()) {
      const { h, s, v } = hexToHsv(value)
      setHue(h)
      setSat(s)
      setVal(v)
      setHexInput(value)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function emit(h: number, s: number, v: number) {
    const hex = hsvToHex(h, s, v)
    setHexInput(hex)
    onChange(hex)
  }

  function onGradPointer(e: React.PointerEvent<HTMLDivElement>) {
    const el = gradRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const newS = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newV = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
    setSat(newS)
    setVal(newV)
    emit(hue, newS, newV)
  }

  function onHuePointer(e: React.PointerEvent<HTMLDivElement>) {
    const el = hueRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const newH = Math.max(0, Math.min(359.9, ((e.clientX - rect.left) / rect.width) * 360))
    setHue(newH)
    emit(newH, sat, val)
  }

  const pureHue = `hsl(${hue}, 100%, 50%)`
  const currentHex = hsvToHex(hue, sat, val)

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C9E8A] rounded"
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {label && (
          <span className="text-[10px] text-[#8B7D72] font-medium uppercase tracking-wide">
            {label}
          </span>
        )}
        <span
          className="block w-5 h-5 rounded-full border-2 border-white shadow-[var(--shadow-xs)] ring-1 ring-[#E8E2D9] transition-transform hover:scale-110"
          style={{ backgroundColor: value }}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Color picker"
          className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-[var(--shadow-xl)] border border-[#E8E2D9] p-3 select-none"
          style={{ width: 216 }}
        >
          {/* Saturation / brightness gradient square */}
          <div
            ref={gradRef}
            className="relative w-full rounded-lg mb-2 cursor-crosshair overflow-hidden"
            style={{
              height: 130,
              background: `linear-gradient(to bottom, transparent, #000),
                           linear-gradient(to right, #fff, ${pureHue})`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              onGradPointer(e)
            }}
            onPointerMove={(e) => { if (e.buttons) onGradPointer(e) }}
          >
            {/* Crosshair dot */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: currentHex,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Hue slider */}
          <div
            ref={hueRef}
            className="relative w-full rounded-full mb-3 cursor-pointer"
            style={{
              height: 12,
              background:
                'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              onHuePointer(e)
            }}
            onPointerMove={(e) => { if (e.buttons) onHuePointer(e) }}
          >
            {/* Thumb */}
            <div
              className="absolute top-1/2 rounded-full border-2 border-white pointer-events-none"
              style={{
                width: 16,
                height: 16,
                left: `${(hue / 360) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: pureHue,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.25)',
              }}
            />
          </div>

          {/* Quick-pick swatches */}
          <div className="grid grid-cols-10 gap-1 mb-3">
            {CALMING_COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => {
                  onChange(c)
                  const { h, s, v } = hexToHsv(c)
                  setHue(h); setSat(s); setVal(v); setHexInput(c)
                  setOpen(false)
                }}
                className="rounded-full transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7C9E8A]"
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: c,
                  boxShadow:
                    c.toLowerCase() === value.toLowerCase()
                      ? '0 0 0 2px white, 0 0 0 3.5px #7C9E8A'
                      : '0 0 0 1px rgba(0,0,0,0.12)',
                }}
              />
            ))}
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md shrink-0 border border-[#E8E2D9]"
              style={{ backgroundColor: value }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value)
                if (isValidHex(e.target.value)) {
                  onChange(e.target.value)
                  const { h, s, v } = hexToHsv(e.target.value)
                  setHue(h); setSat(s); setVal(v)
                }
              }}
              className="flex-1 text-xs font-mono border border-[#E8E2D9] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C9E8A] bg-[#FEFCF8] text-[#2C2825]"
              placeholder="#2C2825"
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
