import type { Mood } from '@/types/journal'

export type BadgeVariant = 'default' | Mood

export interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[#F2EEE8] text-[#8B7D72] dark:bg-[#2E2A27] dark:text-[#BDB5AF]',
  calm:     'bg-[#EAF1EC] text-[#6A9B77] dark:bg-[#1E3328] dark:text-[#7FB88A]',
  happy:    'bg-[#FFF8E6] text-[#B8860B] dark:bg-[#2E2A14] dark:text-[#D4A030]',
  anxious:  'bg-[#FFF0ED] text-[#C4614E] dark:bg-[#2E1A18] dark:text-[#E8907E]',
  sad:      'bg-[#EEF2F8] text-[#5B7FA6] dark:bg-[#1A2030] dark:text-[#7A9EC8]',
  grateful: 'bg-[#F5EFF8] text-[#8A5FA6] dark:bg-[#251830] dark:text-[#B085D0]',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  )
}
