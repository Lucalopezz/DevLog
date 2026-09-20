import { RefreshCw } from "lucide-react";
import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";

export function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Could not load this section.
      </p>
      <Button onClick={onRetry} size="sm" type="button" variant="outline">
        <RefreshCw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}

export function EmptySection({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export function DetailPagination({
  isFetching,
  meta,
  onPageChange,
}: {
  isFetching: boolean;
  meta?: Meta;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.lastPage <= 1) return null;

  const isFirstPage = meta.currentPage <= 1;
  const isLastPage = meta.currentPage >= meta.lastPage;

  return (
    <nav
      aria-label="Section pagination"
      className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Page {meta.currentPage} of {meta.lastPage} ·{" "}
        {meta.total.toLocaleString("en-US")} item(s)
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={isFirstPage || isFetching}
          onClick={() => onPageChange(meta.currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={isLastPage || isFetching}
          onClick={() => onPageChange(meta.currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export function LoadingSection() {
  // role=status announces the loading state to assistive technology too.
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center"
      role="status"
    >
      <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">Loading content...</p>
    </div>
  );
}
