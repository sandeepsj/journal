'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import type { JournalEntryListItem } from '@/types/journal'

interface UseJournalEntriesReturn {
  entries: JournalEntryListItem[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  deleteEntry: (id: string) => Promise<void>
  refresh: () => void
  setPinned: (id: string, pinned: boolean) => void
}

export function useJournalEntries(search: string): UseJournalEntriesReturn {
  const [entries, setEntries] = useState<JournalEntryListItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ page: String(pageNum) })
        if (debouncedSearch) params.set('search', debouncedSearch)

        const res = await fetch(`/api/journal?${params}`)
        if (!res.ok) throw new Error('Failed to load entries')

        const data = await res.json()
        setEntries((prev) => (replace ? data.entries : [...prev, ...data.entries]))
        setHasMore(pageNum < data.pagination.pages)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    },
    [debouncedSearch]
  )

  // Refetch from page 1 when search changes
  useEffect(() => {
    fetchPage(1, true)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    fetchPage(page + 1, false)
  }, [fetchPage, page])

  const deleteEntry = useCallback(
    async (id: string) => {
      // Optimistic remove
      setEntries((prev) => prev.filter((e) => e.id !== id))
      try {
        const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Delete failed')
      } catch {
        // Revert on failure
        fetchPage(1, true)
      }
    },
    [fetchPage]
  )

  const refresh = useCallback(() => fetchPage(1, true), [fetchPage])

  const setPinned = useCallback((id: string, pinned: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, pinned } : e)))
  }, [])

  return { entries, isLoading, error, hasMore, loadMore, deleteEntry, refresh, setPinned }
}
