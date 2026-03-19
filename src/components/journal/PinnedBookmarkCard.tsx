import type { Mood } from '@/types/journal'
import { Badge } from '@/components/ui/Badge'
import { DateStamp } from './DateStamp'

// Filled thumbtack icon
function PinFilledIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M16 1a1 1 0 0 0-1 1v1H9V2a1 1 0 0 0-2 0v1H6a2 2 0 0 0-2 2v1c0 2.97 1.88 5.49 4.5 6.33V20a1 1 0 0 0 2 0v-7.67C13.12 11.49 15 8.97 15 6V5h1V2a1 1 0 0 0-1-1z" />
      <path d="M9 2h6v2H9z" />
      <rect x="11" y="12" width="2" height="8" rx="1" />
      <ellipse cx="12" cy="5" rx="4" ry="3" />
    </svg>
  )
}

const moodLabel: Record<Mood, string> = {
  calm:     'Calm',
  happy:    'Happy',
  grateful: 'Grateful',
  anxious:  'Anxious',
  sad:      'Sad',
}

export interface PinnedBookmarkCardProps {
  id: string
  title: string
  mood: Mood | null
  createdAt: string
  onClick: () => void
  onUnpin: () => void
  className?: string
}

export function PinnedBookmarkCard({
  title,
  mood,
  createdAt,
  onClick,
  onUnpin,
  className = '',
}: PinnedBookmarkCardProps) {
  return (
    <article
      className={`w-[200px] h-[120px] flex-shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 shadow-[var(--shadow-xs)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-text-muted)] transition-[transform,box-shadow,border-color] duration-200 cursor-pointer flex flex-col ${className}`}
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
      {/* Top row: mood badge + unpin button */}
      <div className="flex items-center justify-between mb-1.5">
        <div>
          {mood && <Badge label={moodLabel[mood]} variant={mood} />}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUnpin()
          }}
          aria-label="Unpin entry"
          title="Unpin"
          className="text-[var(--color-accent)] hover:text-[var(--color-text-muted)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded p-0.5"
        >
          <PinFilledIcon />
        </button>
      </div>

      {/* Title */}
      <p className="font-serif text-sm text-[var(--color-text-primary)] line-clamp-2 leading-snug flex-1 mb-1.5">
        {title}
      </p>

      {/* Date */}
      <DateStamp date={createdAt} format="short" />
    </article>
  )
}
