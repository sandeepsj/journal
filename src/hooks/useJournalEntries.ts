import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'
import { useAuth } from '@/contexts/AuthContext'
import { listEntries, deleteEntry as driveDeleteEntry } from '@/lib/drive'
import type { DriveEntryListItem } from '@/lib/drive'

const CACHE_KEY = 'muse_entries_cache'
const CACHE_MAX_AGE = 1000 * 60 * 60 // 1 hour

interface CachedData {
  entries: DriveEntryListItem[]
  timestamp: number
}

function readCache(): DriveEntryListItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedData = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cached.entries
  } catch {
    return null
  }
}

function writeCache(entries: DriveEntryListItem[]) {
  try {
    const data: CachedData = { entries, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch { /* storage full or unavailable */ }
}

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
  const [entries, setEntries] = useState<DriveEntryListItem[]>(() => readCache() ?? [])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const hasCachedData = useRef(!!readCache())

  const debouncedSearch = useDebounce(search, 300)

  const fetchEntries = useCallback(
    async (append: boolean, pageToken?: string) => {
      if (!accessToken) return
      // Only show loading spinner if we have no cached data
      if (!hasCachedData.current) {
        setIsLoading(true)
      }
      setError(null)
      try {
        const result = await listEntries(accessToken, {
          search: debouncedSearch || undefined,
          pageSize: 30,
          pageToken,
        })
        const newEntries = append ? [...entries, ...result.entries] : result.entries
        setEntries(newEntries)
        setNextPageToken(result.nextPageToken)
        setHasMore(!!result.nextPageToken)

        // Cache the first page of unfiltered results
        if (!append && !debouncedSearch) {
          writeCache(newEntries)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entries')
      } finally {
        setIsLoading(false)
        hasCachedData.current = false
      }
    },
    [accessToken, debouncedSearch, entries]
  )

  // Refetch from start when search changes
  useEffect(() => {
    fetchEntries(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, debouncedSearch])

  const loadMore = useCallback(() => {
    if (nextPageToken) {
      fetchEntries(true, nextPageToken)
    }
  }, [fetchEntries, nextPageToken])

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!accessToken) return
      const updated = entries.filter((e) => e.id !== id)
      setEntries(updated)
      writeCache(updated)
      try {
        await driveDeleteEntry(accessToken, id)
      } catch {
        // Revert on failure
        fetchEntries(false)
      }
    },
    [accessToken, entries, fetchEntries]
  )

  const refresh = useCallback(() => fetchEntries(false), [fetchEntries])

  const setPinned = useCallback((id: string, pinned: boolean) => {
    setEntries((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, pinned } : e))
      writeCache(updated)
      return updated
    })
  }, [])

  return { entries, isLoading, error, hasMore, loadMore, deleteEntry, refresh, setPinned }
}
