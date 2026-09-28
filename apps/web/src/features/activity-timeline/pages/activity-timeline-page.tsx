import { Activity, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useProjectOptions } from "@/features/projects/hooks/use-project-options";
import { isTechnicalEntryType } from "@/features/technical-entry/types/technical-entry";
import { TimelineEntries } from "../components/timeline-entries";
import { groupEntriesByDay } from "../group-entries-by-day";
import { useActivityTimeline } from "../hooks/use-activity-timeline";

export default function ActivityTimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")?.trim() || undefined;
  const rawType = searchParams.get("type");
  const type = isTechnicalEntryType(rawType) ? rawType : undefined;
  const query = useActivityTimeline({ projectId, type });
  const projectsQuery = useProjectOptions();

  // Merge pages BEFORE grouping: a day split across two responses must still
  // have one heading. Project metadata loads separately and never hides entries.
  const days = groupEntriesByDay(
    query.data?.pages.flatMap((page) => page.data) ?? [],
  );
  const loadedCount = days.reduce(
    (count, day) => count + day.entries.length,
    0,
  );
  const hasFilters = Boolean(projectId || type);

  function updateFilter(key: "projectId" | "type", value: string) {
    // The URL owns filter state so reloads and browser Back/Forward agree with
    // the controls. Page numbers belong to useInfiniteQuery, not the URL.
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (type) params.set("type", type);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Activity
            aria-hidden="true"
            className="size-8 shrink-0 text-primary"
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            Activity Timeline
          </h1>
        </div>
        <p className="text-muted-foreground">
          Explore your entries by creation date.
        </p>
        <p className="text-sm text-muted-foreground">
          Newest entries first, in your local time zone. Archived and deleted
          entries are excluded.
        </p>
      </header>

      <section
        aria-label="Timeline filters"
        className="space-y-3 rounded-xl border bg-card p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label className="text-sm font-medium" htmlFor="timeline-project">
              Project
            </label>
            <select
              className="h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm disabled:opacity-50"
              disabled={
                projectsQuery.isPending ||
                (projectsQuery.isError && !projectsQuery.data)
              }
              id="timeline-project"
              onChange={(event) =>
                updateFilter("projectId", event.target.value)
              }
              value={projectId ?? ""}
            >
              <option value="">All projects</option>
              {projectId &&
              !projectsQuery.data?.some(
                (project) => project.id === projectId,
              ) ? (
                <option value={projectId}>Selected project</option>
              ) : null}
              {projectsQuery.data?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="timeline-type">
              Type
            </label>
            <select
              className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
              id="timeline-type"
              onChange={(event) => updateFilter("type", event.target.value)}
              value={type ?? ""}
            >
              <option value="">All types</option>
              <option value="ISSUE">Issues</option>
              <option value="LEARNING">Learnings</option>
            </select>
          </div>
        </div>
        {projectsQuery.isPending ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading projects...
          </p>
        ) : null}
        {projectsQuery.isError ? (
          <div className="space-y-2 text-sm" role="alert">
            <p>Could not load project names and filter options.</p>
            <Button
              disabled={projectsQuery.isFetching}
              onClick={() => projectsQuery.refetch()}
              size="sm"
              type="button"
              variant="outline"
            >
              Retry projects
            </Button>
          </div>
        ) : null}
        {hasFilters ? (
          <Button
            onClick={() => setSearchParams({})}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear filters
          </Button>
        ) : null}
      </section>

      {query.isPending ? (
        <div
          aria-label="Loading timeline"
          className="flex items-center justify-center gap-2 rounded-xl border p-10 text-sm text-muted-foreground"
          role="status"
        >
          <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
          Loading timeline...
        </div>
      ) : null}
      {query.isFetching && !query.isPending && !query.isFetchingNextPage ? (
        <p className="text-sm text-muted-foreground" role="status">
          Updating timeline...
        </p>
      ) : null}

      {query.isError && !query.isFetchNextPageError ? (
        <section
          aria-labelledby="timeline-error"
          className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="font-semibold" id="timeline-error">
            {query.data
              ? "Could not refresh timeline"
              : "Could not load timeline"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {query.data
              ? "The entries shown may be out of date. Try again to refresh them."
              : "Check your connection and try again."}
          </p>
          <Button
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </section>
      ) : null}

      {query.isSuccess && loadedCount === 0 ? (
        <section className="space-y-2 rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">No entries found</h2>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "Try changing or clearing the filters."
              : "Record an issue or learning to start your timeline."}
          </p>
        </section>
      ) : null}

      {loadedCount > 0 ? (
        <>
          <TimelineEntries
            days={days}
            isLoadingProjects={projectsQuery.isPending}
            projects={projectsQuery.data ?? []}
          />
          <footer className="space-y-3 border-t pt-4">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {loadedCount.toLocaleString("en-US")}{" "}
              {loadedCount === 1 ? "entry" : "entries"} loaded
            </p>
            {/* A failed next page leaves earlier pages readable. Retry that
                page instead of discarding the entries already loaded. */}
            {query.isFetchNextPageError ? (
              <p className="text-sm text-destructive" role="alert">
                Could not load more entries. Try again.
              </p>
            ) : null}
            <Button
              disabled={
                !query.hasNextPage || query.isFetching || query.isRefetchError
              }
              onClick={() => query.fetchNextPage()}
              type="button"
              variant="outline"
            >
              {query.isFetchingNextPage
                ? "Loading more..."
                : query.isFetchNextPageError
                  ? "Retry loading more"
                  : query.hasNextPage
                    ? "Load more"
                    : "All entries loaded"}
            </Button>
          </footer>
        </>
      ) : null}
    </main>
  );
}
