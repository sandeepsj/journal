import type { Mood } from '@/types/journal'

export type BadgeVariant = 'default' | Mood

export interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[#F2EEE8] text-[#8B7D72]',
  calm:     'bg-[#EAF1EC] text-[#6A9B77]',
  happy:    'bg-[#FFF8E6] text-[#B8860B]',
  anxious:  'bg-[#FFF0ED] text-[#C4614E]',
  sad:      'bg-[#EEF2F8] text-[#5B7FA6]',
  grateful: 'bg-[#F5EFF8] text-[#8A5FA6]',
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
