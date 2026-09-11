import { Skeleton } from "@/components/ui/skeleton";

export function TechnicalEntryDetailSkeleton() {
  return (
    <div aria-label="Loading technical entry" className="space-y-8" role="status">
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-2/3 max-w-xl" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="min-h-80 rounded-2xl" />
        <Skeleton className="min-h-80 rounded-2xl" />
      </div>
    </div>
  );
}
