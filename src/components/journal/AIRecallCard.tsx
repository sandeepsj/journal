import { DateStamp } from './DateStamp'
import type { Mood } from '@/types/journal'

export interface AIRecallCardProps {
  title: string
  excerpt: string
  createdAt: string
  mood?: Mood | null
}

export function AIRecallCard({ title, excerpt, createdAt, mood: _mood }: AIRecallCardProps) {
  return (
    <div className="bg-[#FAFAF9] border-l-2 border-[#7C9E8A] pl-3 py-1 rounded-r-md shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-l-[#6A9B77] transition-[box-shadow,border-color] duration-150">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium text-[#7C9E8A] uppercase tracking-wide">
          Recalled from
        </span>
        <DateStamp date={createdAt} format="short" />
      </div>
      <p className="text-sm font-serif text-[#2C2825] mb-0.5 line-clamp-1">{title}</p>
      <p className="text-xs text-[#8B7D72] line-clamp-2 leading-relaxed">{excerpt}</p>
    </div>
  )
}
