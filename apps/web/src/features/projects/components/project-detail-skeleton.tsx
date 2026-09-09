import { Skeleton } from "@/components/ui/skeleton";

export function ProjectDetailSkeleton() {
  return (
    <div aria-label="Loading project" className="space-y-8" role="status">
      <div className="space-y-5">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-2/3 max-w-md" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
        </div>
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Skeleton className="min-h-64 rounded-2xl" />
        <Skeleton className="min-h-64 rounded-2xl" />
      </div>
    </div>
  );
}
