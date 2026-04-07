import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { useAuth } from '@/contexts/AuthContext'
import { listEntries, deleteEntry as driveDeleteEntry } from '@/lib/drive'
import type { DriveEntryListItem } from '@/lib/drive'

interface UseJournalEntriesReturn {
  entries: DriveEntryListItem[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  deleteEntry: (id: string) => Promise<void>
  refresh: () => void
  setPinned: (id: string, pinned: boolean) => void
}

export function useJournalEntries(search: string): UseJournalEntriesReturn {
  const { accessToken } = useAuth()
  const [entries, setEntries] = useState<DriveEntryListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()

  const debouncedSearch = useDebounce(search, 300)

  const fetchEntries = useCallback(
    async (append: boolean, pageToken?: string) => {
      if (!accessToken) return
      setIsLoading(true)
      setError(null)
      try {
        const result = await listEntries(accessToken, {
          search: debouncedSearch || undefined,
          pageSize: 30,
          pageToken,
        })
        setEntries((prev) => append ? [...prev, ...result.entries] : result.entries)
        setNextPageToken(result.nextPageToken)
        setHasMore(!!result.nextPageToken)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entries')
      } finally {
        setIsLoading(false)
      }
    },
    [accessToken, debouncedSearch]
  )

  // Refetch from start when search changes
  useEffect(() => {
    fetchEntries(false)
  }, [fetchEntries])

  const loadMore = useCallback(() => {
    if (nextPageToken) {
      fetchEntries(true, nextPageToken)
    }
  }, [fetchEntries, nextPageToken])

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!accessToken) return
      // Optimistic remove
      setEntries((prev) => prev.filter((e) => e.id !== id))
      try {
        await driveDeleteEntry(accessToken, id)
      } catch {
        // Revert on failure
        fetchEntries(false)
      }
    },
    [accessToken, fetchEntries]
  )

  const refresh = useCallback(() => fetchEntries(false), [fetchEntries])

  const setPinned = useCallback((id: string, pinned: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, pinned } : e)))
  }, [])

  return { entries, isLoading, error, hasMore, loadMore, deleteEntry, refresh, setPinned }
}
