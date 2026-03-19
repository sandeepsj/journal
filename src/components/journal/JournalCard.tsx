import type { Mood } from '@/types/journal'
import { Badge } from '@/components/ui/Badge'
import { DateStamp } from './DateStamp'

export interface JournalCardProps {
  id: string
  title: string
  excerpt: string
  mood: Mood | null
  createdAt: string
  wordCount: number
  onClick: () => void
  onDelete?: () => void
  isPinned?: boolean
  onPin?: (meta: { title: string; mood: Mood | null; createdAt: string }) => void
  className?: string
}

const moodLabel: Record<Mood, string> = {
  calm:     'Calm',
  happy:    'Happy',
  grateful: 'Grateful',
  anxious:  'Anxious',
  sad:      'Sad',
}

export function JournalCard({
  title,
  excerpt,
  mood,
  createdAt,
  wordCount,
  onClick,
  onDelete,
  isPinned = false,
  onPin,
  className = '',
}: JournalCardProps) {
  return (
    <article
      className={`animate-slide-up group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-[var(--shadow-xs)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] transition-[transform,box-shadow,background,border-color] duration-200 cursor-pointer ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-serif text-xl text-[var(--color-text-primary)] line-clamp-1 flex-1">{title}</h3>
        <DateStamp date={createdAt} format="short" />
      </div>

      <p className="font-serif text-base text-[var(--color-text-secondary)] line-clamp-2 mb-3 leading-relaxed">{excerpt}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mood && <Badge label={moodLabel[mood]} variant={mood} />}
          <span className="text-sm text-[var(--color-text-muted)]">{wordCount} words</span>
        </div>

        <div className="flex items-center gap-1">
          {onPin && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPin({ title, mood, createdAt })
              }}
              aria-label={isPinned ? 'Unpin entry' : 'Pin entry'}
              title={isPinned ? 'Unpin' : 'Pin'}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md p-0.5 ${isPinned ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'}`}
            >
              {isPinned ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M16 1a1 1 0 0 0-2 0v1H10V1a1 1 0 0 0-2 0v1H7a2 2 0 0 0-2 2v1c0 2.97 1.88 5.49 4.5 6.33V20a1 1 0 0 0 2 0v-7.67C14.12 11.49 16 8.97 16 6V5h1V2a1 1 0 0 0-1-1z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="17" x2="12" y2="22" />
                  <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
              )}
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete entry"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--color-text-muted)] hover:text-[var(--color-error)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)] rounded-md p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
