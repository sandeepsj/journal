'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { SearchInput } from './SearchInput'
import { JournalCard } from './JournalCard'
import { EmptyState } from './EmptyState'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { Modal } from '@/components/layout/Modal'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { usePinnedEntries } from '@/hooks/usePinnedEntries'
import { PinnedRail } from './PinnedRail'
import { PinLimitBanner } from './PinLimitBanner'

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

  const { entries, isLoading, error, hasMore, loadMore, deleteEntry, setPinned } =
    useJournalEntries(search)

  const { pinnedEntries, isLoading: pinnedLoading, pinError, clearPinError, togglePin } =
    usePinnedEntries()

  async function confirmDelete() {
    if (!deleteId) return
    await deleteEntry(deleteId)
    setDeleteId(null)
  }

  const showEmpty = !isLoading && !error && entries.length === 0
  const greeting = getGreeting(userName)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-28 space-y-8 animate-page-enter relative">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-4xl text-[#2C2825] animate-slide-up stagger-1">{greeting}</h1>
        <p className="text-base text-[#B5A99F] mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Ask your journal card */}
      <button
        onClick={() => router.push('/recall')}
        className="w-full text-left bg-gradient-to-r from-[#EAF1EC] to-white border border-[#E8E2D9] rounded-2xl px-5 py-4 flex items-center gap-4 hover:from-[#7C9E8A]/10 hover:to-[#EAF1EC] hover:border-[#7C9E8A] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-accent)] transition-all duration-200 group"
      >
        <div className="w-10 h-10 rounded-full bg-[#EAF1EC] flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C9E8A] group-hover:shadow-[var(--shadow-accent)] transition-all duration-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7C9E8A] group-hover:text-white transition-colors duration-150">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-[#2C2825]">Ask your journal</p>
          <p className="text-sm text-[#B5A99F] truncate">What have I been grateful for lately?</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4CEC8] group-hover:text-[#7C9E8A] transition-colors duration-150 flex-shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* Pinned rail */}
      {(pinnedLoading || pinnedEntries.length > 0) && (
        <div className="space-y-2">
          {pinError && <PinLimitBanner message={pinError} onDismiss={clearPinError} />}
          <PinnedRail
            entries={pinnedEntries}
            isLoading={pinnedLoading}
            onEntryClick={(id) => router.push(`/journal/${id}`)}
            onUnpin={(id) => {
              togglePin(id, true)
              setPinned(id, false)
            }}
          />
        </div>
      )}

      {/* Entry list header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#8B7D72] uppercase tracking-wide">
            Your entries
          </h2>
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry, index) => (
              <JournalCard
                key={entry.id}
                {...entry}
                onClick={() => router.push(`/journal/${entry.id}`)}
                onDelete={() => setDeleteId(entry.id)}
                isPinned={entry.pinned}
                onPin={(meta) => {
                  togglePin(entry.id, entry.pinned, meta)
                  setPinned(entry.id, !entry.pinned)
                }}
                className={`stagger-${(index % 5) + 1}`}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button variant="ghost" size="sm" onClick={loadMore} loading={isLoading}>
                Load more
              </Button>
            </div>
          )}

          {isLoading && entries.length > 0 && (
            <div className="flex justify-center pt-2">
              <LoadingDots size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete entry" size="sm">
        <p className="text-base text-[#8B7D72] mb-6">
          This entry will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Floating action button — new entry */}
      <button
        onClick={() => router.push('/journal/new')}
        aria-label="New journal entry"
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 xl:right-16 w-14 h-14 rounded-full bg-[#7C9E8A] text-white shadow-[var(--shadow-lg)] hover:bg-[#6A9B77] hover:shadow-[var(--shadow-accent)] hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center z-30"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
