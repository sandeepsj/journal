import { useState, useEffect, useRef, useCallback } from 'react'
import type { SaveStatus } from '@/components/journal/AutoSaveStatus'

interface UseAutoSaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void>
  interval?: number
  enabled?: boolean
}

interface UseAutoSaveReturn {
  status: SaveStatus
  save: () => Promise<void>
  isDirty: boolean
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const isDirtyRef = useRef(false)
  const dataRef = useRef(data)
  const onSaveRef = useRef(onSave)
  const statusResetRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isFirstRender = useRef(true)

  // Keep refs current without triggering effects
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { onSaveRef.current = onSave }, [onSave])

  // Mark dirty when data changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    isDirtyRef.current = true
  }, [data])

  const save = useCallback(async () => {
    if (!isDirtyRef.current) return

    clearTimeout(statusResetRef.current)
    setStatus('saving')

    try {
      await onSaveRef.current(dataRef.current)
      isDirtyRef.current = false
      setStatus('saved')
      statusResetRef.current = setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      statusResetRef.current = setTimeout(() => setStatus('idle'), 4000)
    }
  }, [])

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(save, interval)
    return () => clearInterval(timer)
  }, [enabled, interval, save])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(statusResetRef.current)
  }, [])

  return { status, save, isDirty: isDirtyRef.current }
}
