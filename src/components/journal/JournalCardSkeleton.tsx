import { Skeleton } from '@/components/ui/Skeleton'

export function JournalCardSkeleton() {
  return (
    <div
      className="bg-white border border-[#E8E2D9] rounded-xl p-5 space-y-3"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-16" rounded="sm" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" rounded="sm" />
        <Skeleton className="h-3 w-4/5" rounded="sm" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-14" rounded="full" />
        <Skeleton className="h-3 w-12" rounded="sm" />
      </div>
    </div>
  )
}
