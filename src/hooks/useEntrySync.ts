import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getEntry } from '@/lib/drive'

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
  const { accessToken } = useAuth()
  const [isStale, setIsStale] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  const fetchAndReload = useCallback(async () => {
    if (!entryId || !accessToken) return
    try {
      const data = await getEntry(accessToken, entryId)
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
  }, [entryId, accessToken])

  // BroadcastChannel for cross-tab sync
  useEffect(() => {
    if (!entryId || typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel('muse-journal')
    channelRef.current = ch

    ch.onmessage = (e) => {
      if (e.data?.entryId !== entryId) return
      if (!isDirtyRef.current) {
        fetchAndReload()
      } else {
        setIsStale(true)
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
