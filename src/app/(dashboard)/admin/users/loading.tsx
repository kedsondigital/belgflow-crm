import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
