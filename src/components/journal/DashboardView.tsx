'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { SearchInput } from './SearchInput'
import { JournalCard } from './JournalCard'
import { EmptyState } from './EmptyState'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { RecallPanel } from './RecallPanel'
import { Modal } from '@/components/layout/Modal'
import { useJournalEntries } from '@/hooks/useJournalEntries'

export interface DashboardViewProps {
  userName: string
}

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  const firstName = name.split(' ')[0]
  if (hour < 12) return `Good morning, ${firstName}`
  if (hour < 17) return `Good afternoon, ${firstName}`
  return `Good evening, ${firstName}`
}

export function DashboardView({ userName }: DashboardViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { entries, isLoading, error, hasMore, loadMore, deleteEntry } =
    useJournalEntries(search)

  async function confirmDelete() {
    if (!deleteId) return
    await deleteEntry(deleteId)
    setDeleteId(null)
  }

  const showEmpty = !isLoading && !error && entries.length === 0
  const greeting = getGreeting(userName)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-page-enter">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-4xl text-[#2C2825]">{greeting}</h1>
        <p className="text-base text-[#B5A99F] mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Recall panel */}
      <RecallPanel />

      {/* Entry list header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#8B7D72] uppercase tracking-wide">
            Your entries
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/journal/new')}
            aria-label="New journal entry"
          >
            + New entry
          </Button>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          placeholder="Search your entries…"
        />
      </div>

      {/* States */}
      {isLoading && entries.length === 0 && (
        <div className="flex justify-center py-16">
          <LoadingDots size="md" />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-base text-[#C4614E] mb-3">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      )}

      {showEmpty && !search && (
        <EmptyState
          title="Your story starts here"
          description="Write your first entry and begin building your personal memory."
          action={{ label: 'Write your first entry', onClick: () => router.push('/journal/new') }}
        />
      )}

      {showEmpty && search && (
        <EmptyState
          title="No entries found"
          description={`Nothing matched "${search}". Try a different search.`}
        />
      )}

      {/* Entry grid */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((entry) => (
              <JournalCard
                key={entry.id}
                {...entry}
                onClick={() => router.push(`/journal/${entry.id}`)}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                loading={isLoading}
              >
                Load more
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {isLoading && entries.length > 0 && (
            <div className="flex justify-center pt-2">
              <LoadingDots size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete entry"
        size="sm"
      >
        <p className="text-base text-[#8B7D72] mb-6">
          This entry will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
