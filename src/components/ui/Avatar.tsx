import Image from 'next/image'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
}

const sizeMap: Record<AvatarSize, { px: number; text: string }> = {
  sm: { px: 28, text: 'text-xs' },
  md: { px: 36, text: 'text-sm' },
  lg: { px: 48, text: 'text-base' },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const { px, text } = sizeMap[size]

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium flex items-center justify-center select-none ${text}`}
      style={{ width: px, height: px }}
      aria-label={name}
      role="img"
    >
      {getInitials(name)}
    </div>
  )
}
