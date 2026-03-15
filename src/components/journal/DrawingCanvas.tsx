'use client'

import { useEffect, useRef, RefObject } from 'react'

export interface DrawingCanvasProps {
  active: boolean
  brushColor: string
  brushSize: number
  erasing?: boolean
  initialData?: string
  canvasRef: RefObject<HTMLCanvasElement | null>
  onChange: (dataUrl: string) => void
}

export function DrawingCanvas({
  active,
  brushColor,
  brushSize,
  erasing = false,
  initialData,
  canvasRef,
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
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    img.src = src
  }

  // Sync canvas size to parent via ResizeObserver — restore snapshot after each resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      if (width === 0 || height === 0) return
      // Setting dimensions clears the canvas — restore from snapshot
      canvas.width = width
      canvas.height = height
      restoreSnapshot(canvas)
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    resizeCanvas()

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef])

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
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
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
    ctx.lineWidth = brushSize
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
        inset: 0,
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
