'use client'

import { useEffect, useRef, RefObject } from 'react'

export interface DrawingCanvasProps {
  active: boolean
  brushColor: string
  brushSize: number
  eraserSize?: number
  erasing?: boolean
  initialData?: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** Observe this element's scrollHeight for canvas height (use textarea ref so
   *  canvas grows with content instead of being clamped by the flex-1 parent) */
  sizeRef?: RefObject<HTMLTextAreaElement | null>
  onChange: (dataUrl: string) => void
}

export function DrawingCanvas({
  active,
  brushColor,
  brushSize,
  eraserSize = 14,
  erasing = false,
  initialData,
  canvasRef,
  sizeRef,
  onChange,
}: DrawingCanvasProps) {
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  // Keep a live snapshot of the current drawing so resize can restore it
  const snapshotRef = useRef<string | null>(initialData ?? null)

  function restoreSnapshot(canvas: HTMLCanvasElement) {
    const src = snapshotRef.current
    if (!src) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    // Draw at 1:1 — do NOT stretch to canvas dimensions.
    // When the canvas grows (more text), existing drawings stay in place and
    // the newly revealed area below is simply blank.
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = src
  }

  // Sync canvas size — observe the textarea (sizeRef) when provided so the
  // canvas grows with content, bypassing the flex-1 parent height constraint.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const resizeCanvas = () => {
      // Width always comes from the parent (= paper width)
      const width = parent.clientWidth
      // Height: use textarea's full scrollHeight so canvas covers all text,
      // even when the textarea overflows the flex-1 container
      const height = sizeRef?.current
        ? sizeRef.current.scrollHeight
        : parent.getBoundingClientRect().height
      if (width === 0 || height === 0) return
      canvas.width = width
      canvas.height = height
      restoreSnapshot(canvas)
    }

    // Observe whichever element drives the height
    const observeTarget = sizeRef?.current ?? parent
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(observeTarget)
    resizeCanvas()

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, sizeRef])

  // Sync canvas pixels whenever initialData changes (undo/redo/clear/load from DB)
  useEffect(() => {
    snapshotRef.current = initialData ?? null
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (initialData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)  // 1:1, consistent with restoreSnapshot
      img.src = initialData
    }
  }, [initialData, canvasRef])

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!active) return
    isDrawingRef.current = true
    lastPosRef.current = getPos(e)
    ;(e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!active || !isDrawingRef.current || !lastPosRef.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)

    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'
    ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : brushColor
    ctx.lineWidth = erasing ? eraserSize : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    lastPosRef.current = pos
  }

  function handlePointerUp() {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastPosRef.current = null
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png')
      snapshotRef.current = dataUrl  // keep snapshot current after each stroke
      onChange(dataUrl)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        // width: 100% matches the parent; height is NOT set in CSS so the
        // browser uses the HTML canvas.height attribute — this lets the canvas
        // grow to textarea.scrollHeight instead of being clipped to the
        // flex-1 parent's layout height
        width: '100%',
        zIndex: 2,
        pointerEvents: active ? 'auto' : 'none',
        cursor: active ? (erasing ? 'cell' : 'crosshair') : 'default',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label="Drawing canvas"
      aria-hidden={!active}
    />
  )
}
