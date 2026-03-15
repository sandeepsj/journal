'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PinnedEntryCard, Mood } from '@/types/journal'

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
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pinError, setPinError] = useState<string | null>(null)

  const fetchPinned = useCallback(async () => {
    try {
      const res = await fetch('/api/journal/pinned')
      if (!res.ok) throw new Error('Failed to load pinned entries')
      const data = await res.json()
      setPinnedEntries(data.entries)
    } catch (err) {
      console.error('[usePinnedEntries] fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
      const pinning = !currentlyPinned

      // Client-side cap check
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
        const res = await fetch(`/api/journal/${id}/pin`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinned: pinning }),
        })

        if (!res.ok) {
          const data = await res.json()
          if (data.error === 'PIN_LIMIT_REACHED') {
            setPinError('You can pin up to 10 entries. Unpin one to continue.')
          }
          // Revert optimistic update
          await fetchPinned()
          return
        }

        // Re-fetch to ensure consistency
        await fetchPinned()
      } catch (err) {
        console.error('[usePinnedEntries] togglePin error:', err)
        await fetchPinned()
      }
    },
    [pinnedEntries.length, fetchPinned]
  )

  return { pinnedEntries, isLoading, pinError, clearPinError, togglePin }
}
