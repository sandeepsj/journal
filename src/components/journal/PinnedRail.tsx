import type { PinnedEntryCard } from '@/types/journal'
import { PinnedBookmarkCard } from './PinnedBookmarkCard'

export interface PinnedRailProps {
  entries: PinnedEntryCard[]
  isLoading: boolean
  onEntryClick: (id: string) => void
  onUnpin: (id: string) => void
}

export function PinnedRail({ entries, isLoading, onEntryClick, onUnpin }: PinnedRailProps) {
  if (!isLoading && entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-base font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Pinned</h2>

      <div className="relative">
        {/* Scroll container */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[200px] h-[120px] flex-shrink-0 rounded-xl bg-[var(--color-surface-muted)] animate-pulse"
                />
              ))
            : entries.map((entry) => (
                <PinnedBookmarkCard
                  key={entry.id}
                  {...entry}
                  onClick={() => onEntryClick(entry.id)}
                  onUnpin={() => onUnpin(entry.id)}
                />
              ))}
        </div>

        {/* Right-edge fade — signals more content */}
        {!isLoading && entries.length > 0 && (
          <div className="absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-[var(--color-bg)] pointer-events-none" />
        )}
      </div>
    </div>
  )
}
