import { Skeleton } from '@/components/ui/skeleton'

export function RouteLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading your workspace"
      className="mx-auto max-w-5xl space-y-6 p-6"
    >
      <p role="status" className="text-muted-foreground">
        Loading your workspace…
      </p>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </main>
  )
}
