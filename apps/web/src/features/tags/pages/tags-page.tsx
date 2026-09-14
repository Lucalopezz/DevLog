import { Hash, Plus, RefreshCw, Tag as TagIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useDeleteTag } from "../hooks/use-delete-tag";
import { useTags } from "../hooks/use-tags";
import { TagFilter } from "../components/tag-filter";
import { TagForm } from "../components/tag-form";
import { TagList } from "../components/tag-list";
import { TagListSkeleton } from "../components/tag-list-skeleton";
import { TagPagination } from "../components/tag-pagination";
import type { ListTagsParams } from "../types/tag";

const defaultTagParams = {
  perPage: 12,
  sort: "name",
  sortDir: "asc",
} satisfies Omit<ListTagsParams, "page">;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function TagsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);

  // The URL stores the applied search and page so refresh, back/forward
  // navigation, and shared links all preserve the same tag query.
  const page = parsePage(searchParams.get("page"));
  const name = searchParams.get("name")?.trim() || undefined;
  const params = {
    ...defaultTagParams,
    page,
    ...(name ? { name } : {}),
  } satisfies ListTagsParams;
  const { data, isError, isFetching, isPending, refetch } = useTags(params);
  const deleteMutation = useDeleteTag();

  // React Query keeps the mutation variables, which lets the list show a
  // spinner only on the tag currently being deleted.
  const deletingTagId = deleteMutation.isPending
    ? deleteMutation.variables
    : undefined;

  function handleSearch(nextName: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("name");

    // A different search starts at page one; otherwise a valid old page can
    // incorrectly produce an empty result for the new search.
    nextParams.set("page", "1");

    const normalizedName = nextName.trim();
    if (normalizedName) nextParams.set("name", normalizedName);

    setSearchParams(nextParams);
  }

  function handleClearFilters() {
    setSearchParams({});
  }

  function handlePageChange(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <TagIcon className="size-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Tags</h1>
          </div>
          <p className="text-muted-foreground">
            Manage the reusable tags in your technical journal.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <Button onClick={() => setIsCreateTagDialogOpen(true)} type="button">
            <Plus data-icon="inline-start" />
            New tag
          </Button>

          {isFetching && !isPending ? (
            <p
              aria-live="polite"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <RefreshCw className="size-4 animate-spin" />
              Updating...
            </p>
          ) : null}
        </div>
      </header>

      <TagForm
        onOpenChange={setIsCreateTagDialogOpen}
        open={isCreateTagDialogOpen}
      />

      <TagFilter
        initialName={name ?? ""}
        key={name ?? ""}
        onClear={handleClearFilters}
        onSearch={handleSearch}
      />

      {isPending ? <TagListSkeleton /> : null}

      {isError ? (
        <section
          aria-labelledby="tags-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <div className="space-y-1">
            <h2 className="font-semibold" id="tags-error-title">
              Could not load tags
            </h2>
            <p className="text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
          </div>
          <Button onClick={() => refetch()} type="button" variant="outline">
            Try again
          </Button>
        </section>
      ) : null}

      {!isPending && !isError && data?.data.length === 0 ? (
        <section className="space-y-2 rounded-xl border border-dashed p-10 text-center">
          <Hash className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-semibold">No tags found</h2>
          <p className="text-sm text-muted-foreground">
            Create your first tag to organize your technical knowledge.
          </p>
        </section>
      ) : null}

      {!isPending && !isError && data && data.data.length > 0 ? (
        <>
          <TagList
            deletingTagId={deletingTagId}
            onDelete={(tagId) => deleteMutation.mutateAsync(tagId)}
            tags={data.data}
          />
          <TagPagination
            isFetching={isFetching}
            meta={data.meta}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </main>
  );
}
