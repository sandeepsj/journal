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
  className = '',
}: JournalCardProps) {
  return (
    <article
      className={`animate-slide-up group bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-[var(--shadow-xs)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[#B5A99F] hover:bg-gradient-to-br hover:from-white hover:to-[#F7F4F0] transition-[transform,box-shadow,background] duration-200 cursor-pointer ${className}`}
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
        <h3 className="font-serif text-xl text-[#2C2825] line-clamp-1 flex-1">{title}</h3>
        <DateStamp date={createdAt} format="short" />
      </div>

      <p className="font-serif text-base text-[#8B7D72] line-clamp-2 mb-3 leading-relaxed">{excerpt}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mood && <Badge label={moodLabel[mood]} variant={mood} />}
          <span className="text-sm text-[#B5A99F]">{wordCount} words</span>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Delete entry"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#B5A99F] hover:text-[#C4614E] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4614E] rounded-md p-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
    </article>
  )
}
