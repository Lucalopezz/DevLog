import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Meta } from "@/api/types";
import { Button } from "@/components/ui/button";

export function TechnicalEntryPagination({
  isFetching,
  meta,
  onPageChange,
}: {
  isFetching: boolean;
  meta: Meta;
  onPageChange: (page: number) => void;
}) {
  if (meta.lastPage <= 1) return null;

  const isFirstPage = meta.currentPage <= 1;
  const isLastPage = meta.currentPage >= meta.lastPage;

  return (
    <nav
      aria-label="Technical entry pagination"
      className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Page {meta.currentPage} of {meta.lastPage} ·{" "}
        {meta.total.toLocaleString("en-US")} technical entr{meta.total === 1 ? "y" : "ies"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          aria-label="Go to the previous page"
          disabled={isFirstPage || isFetching}
          onClick={() => onPageChange(meta.currentPage - 1)}
          type="button"
          variant="outline"
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <Button
          aria-label="Go to the next page"
          disabled={isLastPage || isFetching}
          onClick={() => onPageChange(meta.currentPage + 1)}
          type="button"
          variant="outline"
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
