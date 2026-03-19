import { Skeleton } from '@/components/ui/Skeleton'
import { JournalCardSkeleton } from '@/components/journal/JournalCardSkeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading dashboard">
      {/* Skeleton navbar */}
      <div className="border-b border-[var(--color-border)] h-14 px-4 flex items-center justify-between max-w-4xl mx-auto">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-7 w-7" rounded="full" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Greeting */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-36" rounded="sm" />
        </div>

        {/* Recall panel */}
        <Skeleton className="h-12 w-full" rounded="lg" />

        {/* List header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" rounded="sm" />
            <Skeleton className="h-7 w-24" rounded="md" />
          </div>
          <Skeleton className="h-9 w-full" rounded="lg" />
        </div>

        {/* Entry cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <JournalCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
