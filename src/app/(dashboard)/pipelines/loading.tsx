import { Skeleton } from '@/components/ui/skeleton'

export default function PipelinesLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="flex gap-4 flex-1">
        <Skeleton className="h-full w-72 shrink-0 rounded-lg" />
        <Skeleton className="h-full flex-1 rounded-lg" />
      </div>
    </div>
  )
}
