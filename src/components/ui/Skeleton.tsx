export type SkeletonRounded = 'sm' | 'md' | 'lg' | 'full'

export interface SkeletonProps {
  className?: string
  rounded?: SkeletonRounded
}

const roundedMap: Record<SkeletonRounded, string> = {
  sm:   'rounded',
  md:   'rounded-lg',
  lg:   'rounded-xl',
  full: 'rounded-full',
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={`bg-[#E8E2D9] animate-pulse ${roundedMap[rounded]} ${className}`}
      aria-hidden="true"
    />
  )
}
