export type DateFormat = 'short' | 'long' | 'relative'

export interface DateStampProps {
  date: string | Date
  format?: DateFormat
}

function formatDate(date: Date, format: DateFormat): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (format === 'relative') {
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function DateStamp({ date, format = 'short' }: DateStampProps) {
  const d = typeof date === 'string' ? new Date(date) : date
  const formatted = formatDate(d, format)
  const iso = d.toISOString()

  return (
    <time dateTime={iso} className="text-xs text-[#B5A99F] tabular-nums">
      {formatted}
    </time>
  )
}
