import { BookOpen } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useTechnicalEntries } from "../hooks/use-technical-entries";
import { TechnicalEntryFilters } from "../components/technical-entry-filter";
import { TechnicalEntryList } from "../components/technical-entry-list";
import { TechnicalEntryListSkeleton } from "../components/technical-entry-list-skeleton";
import { TechnicalEntryPagination } from "../components/technical-entry-pagination";
import {
  isTechnicalEntryStatus,
  isTechnicalEntryType,
  type ListTechnicalEntriesParams,
  type TechnicalEntrySearchFormValues,
} from "../types/technical-entry";

const defaultTechnicalEntryParams = {
  perPage: 10,
  // Keep the archive scope fixed while title/type/status remain user filters.
  archivedAt: "not-null",
  sort: "createdAt",
  sortDir: "desc",
} satisfies Omit<ListTechnicalEntriesParams, "page">;

function parsePage(value: string | null) {
  const page = Number(value);

  // URL values are user-editable. Keep invalid values away from the API.
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function ArchivedTechnicalEntriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePage(searchParams.get("page"));
  const title = searchParams.get("title")?.trim() || undefined;
  const rawType = searchParams.get("type");
  const type = isTechnicalEntryType(rawType) ? rawType : undefined;
  const rawStatus = searchParams.get("status");
  const status =
    type !== "LEARNING" && isTechnicalEntryStatus(rawStatus)
      ? rawStatus
      : undefined;
  const tagId = searchParams.get("tagId") || undefined;
  const tagName = searchParams.get("tagName")?.trim() || undefined;

  const params = {
    ...defaultTechnicalEntryParams,
    page,
    ...(title ? { title } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(tagId ? { tagId } : {}),
  } satisfies ListTechnicalEntriesParams;

  const { data, isError, isFetching, isPending, refetch } =
    useTechnicalEntries(params);

  function handleSearch(filters: TechnicalEntrySearchFormValues) {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("title");
    nextParams.delete("type");
    nextParams.delete("status");
    nextParams.delete("tagId");
    nextParams.delete("tagName");
    nextParams.set("page", "1");

    const normalizedTitle = filters.title.trim();
    if (normalizedTitle) nextParams.set("title", normalizedTitle);
    if (filters.type) nextParams.set("type", filters.type);

    // LEARNING entries do not have OPEN/RESOLVED status in the backend.
    if (filters.status && filters.type !== "LEARNING") {
      nextParams.set("status", filters.status);
    }
    if (filters.tagId) {
      nextParams.set("tagId", filters.tagId);
      nextParams.set("tagName", filters.tagName);
    }

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
            <BookOpen className="size-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">
              Archived technical entries
            </h1>
          </div>
          <p className="text-muted-foreground">
            Browse the issues and learnings archived in your account.
          </p>
        </div>
      </header>
      <TechnicalEntryFilters
        key={`${title ?? ""}:${type ?? ""}:${status ?? ""}:${tagId ?? ""}`}
        initialStatus={status}
        initialTag={tagId ? { id: tagId, name: tagName ?? tagId } : undefined}
        initialTitle={title ?? ""}
        initialType={type}
        onClear={handleClearFilters}
        onSearch={handleSearch}
      />

      {isPending ? <TechnicalEntryListSkeleton /> : null}

      {isError ? (
        <section
          aria-labelledby="technical-entries-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <div className="space-y-1">
            <h2 className="font-semibold" id="technical-entries-error-title">
              Could not load technical entries
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
          <h2 className="font-semibold">No archived technical entries found</h2>
          <p className="text-sm text-muted-foreground">
            Try changing the filters or archive a technical entry first.
          </p>
        </section>
      ) : null}

      {!isPending && !isError && data && data.data.length > 0 ? (
        <>
          <TechnicalEntryList
            description="Issues and learnings from your archived technical journal."
            entries={data.data}
            title="Your archived technical entries"
          />
          <TechnicalEntryPagination
            isFetching={isFetching}
            meta={data.meta}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </main>
  );
}
