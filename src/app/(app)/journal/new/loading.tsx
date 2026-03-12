import { Skeleton } from '@/components/ui/Skeleton'

export default function EditorLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]" aria-busy="true">
      {/* Top bar */}
      <div className="h-12 border-b border-[#E8E2D9] px-6 flex items-center justify-between">
        <Skeleton className="h-4 w-12" rounded="sm" />
        <Skeleton className="h-4 w-16" rounded="sm" />
        <Skeleton className="h-7 w-20" rounded="md" />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 sm:px-8 pt-10 space-y-6">
        <Skeleton className="h-3 w-40" rounded="sm" />
        <Skeleton className="h-10 w-3/4" rounded="sm" />
        <div className="border-t border-[#E8E2D9]" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" rounded="sm" />
          <Skeleton className="h-4 w-5/6" rounded="sm" />
          <Skeleton className="h-4 w-4/6" rounded="sm" />
        </div>
      </div>
    </div>
  )
}
