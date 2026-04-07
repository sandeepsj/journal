import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { listPinnedEntries, togglePin as driveTogglePin } from '@/lib/drive'
import type { Mood } from '@/types/journal'

interface PinnedEntryCard {
  id: string
  title: string
  mood: Mood | null
  createdAt: string
}

const PIN_LIMIT = 10

interface UsePinnedEntriesReturn {
  pinnedEntries: PinnedEntryCard[]
  isLoading: boolean
  pinError: string | null
  clearPinError: () => void
  togglePin: (
    id: string,
    currentlyPinned: boolean,
    meta?: { title: string; mood: Mood | null; createdAt: string }
  ) => Promise<void>
}

export function usePinnedEntries(): UsePinnedEntriesReturn {
  const { accessToken } = useAuth()
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pinError, setPinError] = useState<string | null>(null)

  const fetchPinned = useCallback(async () => {
    if (!accessToken) return
    try {
      const entries = await listPinnedEntries(accessToken)
      setPinnedEntries(
        entries.map((e) => ({
          id: e.id,
          title: e.title,
          mood: e.mood,
          createdAt: e.createdAt,
        }))
      )
    } catch (err) {
      console.error('[usePinnedEntries] fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchPinned()
  }, [fetchPinned])

  const clearPinError = useCallback(() => setPinError(null), [])

  const togglePin = useCallback(
    async (
      id: string,
      currentlyPinned: boolean,
      meta?: { title: string; mood: Mood | null; createdAt: string }
    ) => {
      if (!accessToken) return
      const pinning = !currentlyPinned

      if (pinning && pinnedEntries.length >= PIN_LIMIT) {
        setPinError('You can pin up to 10 entries. Unpin one to continue.')
        return
      }

      // Optimistic update
      if (pinning && meta) {
        setPinnedEntries((prev) => [{ id, ...meta }, ...prev])
      } else {
        setPinnedEntries((prev) => prev.filter((e) => e.id !== id))
      }

      try {
        await driveTogglePin(accessToken, id, pinning)
        await fetchPinned()
      } catch (err) {
        console.error('[usePinnedEntries] togglePin error:', err)
        await fetchPinned()
      }
    },
    [accessToken, pinnedEntries.length, fetchPinned]
  )

  return { pinnedEntries, isLoading, pinError, clearPinError, togglePin }
}
