'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

export interface FreshEntryData {
  title: string
  body: string
  mood: string | null
  textColor: string
  drawing: string | null
}

export function useEntrySync(
  entryId: string | null,
  isDirty: boolean,
  onReload: (data: FreshEntryData) => void
) {
  const [isStale, setIsStale] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const isDirtyRef = useRef(isDirty)

  // Keep ref in sync (avoid stale closure in channel listener)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const fetchAndReload = useCallback(async () => {
    if (!entryId) return
    try {
      const res = await fetch(`/api/journal/${entryId}`)
      if (!res.ok) return
      const data = await res.json()
      onReload({
        title: data.title ?? '',
        body: data.body ?? '',
        mood: data.mood ?? null,
        textColor: data.textColor ?? '#2C2825',
        drawing: data.drawing ?? null,
      })
      setIsStale(false)
    } catch { /* network error — leave stale banner up */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId])

  // BroadcastChannel setup
  useEffect(() => {
    if (!entryId || typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel('muse-journal')
    channelRef.current = ch

    ch.onmessage = (e) => {
      if (e.data?.entryId !== entryId) return
      if (!isDirtyRef.current) {
        fetchAndReload()   // silent reload
      } else {
        setIsStale(true)   // show banner, auto-save paused by caller
      }
    }

    return () => { ch.close(); channelRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId])

  const notifySaved = useCallback(() => {
    channelRef.current?.postMessage({ entryId })
  }, [entryId])

  const dismissStale = useCallback(() => setIsStale(false), [])

  return { isStale, notifySaved, fetchAndReload, dismissStale }
}
