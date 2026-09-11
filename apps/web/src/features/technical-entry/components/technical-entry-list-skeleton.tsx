import { Skeleton } from "@/components/ui/skeleton";

export function TechnicalEntryListSkeleton() {
  return (
    <div
      aria-label="Loading technical entries"
      className="grid gap-4 md:grid-cols-2"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-5 rounded-xl border p-5" key={index}>
          <div className="flex justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-6 w-2/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
