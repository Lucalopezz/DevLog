import { FolderKanban, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProjects } from "../hooks/use-projects";
import { ProjectList } from "../components/project-list";
import { ProjectFilters } from "../components/project-filter";
import type {
  ListProjectsParams,
  ProjectSearchFormValues,
} from "../types/project";
import { isProjectStatus } from "../types/project";
import { ProjectPagination } from "../components/project-list-pagination";
import { ProjectListSkeleton } from "../components/project-list-skeleton";
import { ProjectForm } from "../components/project-form";

const defaultProjectParams = {
  perPage: 10,
  archivedAt: "null",
  sort: "createdAt",
  sortDir: "desc",
} satisfies Omit<ListProjectsParams, "page">;

function parsePage(value: string | null) {
  const page = Number(value);

  // The URL can be edited manually. Never send NaN, zero, or a fractional
  // page to the API, which expects a positive integer page number.
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL represents applied filters. The form keeps a separate draft
  // and only updates these values after submission.
  const page = parsePage(searchParams.get("page"));
  const name = searchParams.get("name")?.trim() || undefined;
  const rawStatus = searchParams.get("status");
  const status = isProjectStatus(rawStatus) ? rawStatus : undefined;

  const params = {
    ...defaultProjectParams,
    page,
    ...(name ? { name } : {}),
    ...(status ? { status } : {}),
  } satisfies ListProjectsParams;

  const { data, isError, isFetching, isPending, refetch } = useProjects(params);

  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);

  function handleSearch(filters: ProjectSearchFormValues) {
    const nextParams = new URLSearchParams(searchParams);

    // Remove previous values so an empty search does not leave
    // old parameters hidden in the URL.
    nextParams.delete("name");
    nextParams.delete("status");

    // A filter change always starts on the first page. Otherwise,
    // a new search could try to open page 4 and appear empty.
    nextParams.set("page", "1");

    const normalizedName = filters.name.trim();

    if (normalizedName) {
      nextParams.set("name", normalizedName);
    }

    // "All" is represented by an absent status. "ALL" is not in the
    // backend enum and must not be sent as a valid status.
    if (filters.status) {
      nextParams.set("status", filters.status);
    }

    setSearchParams(nextParams);
  }

  function handleClearFilters() {
    // Without parameters, the page returns to its defaults: page 1, unarchived
    // projects, creation order, and no text/status filters.
    setSearchParams({});
  }

  function handlePageChange(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);

    // Starting from the current URL preserves name and status when changing
    // pages. Pagination remains part of the same search.
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FolderKanban className="size-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          </div>
          <p className="text-muted-foreground">
            Browse the projects associated with your account.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateProjectDialogOpen(true)}
        >
          New project
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
      </header>

      <ProjectFilters
        // When applied filters change through the URL, `key` creates a new
        // draft with the URL values. While the user is only typing,
        // the URL stays unchanged and the form is not remounted.
        key={`${name ?? ""}:${status ?? ""}`}
        initialName={name ?? ""}
        initialStatus={status}
        onClear={handleClearFilters}
        onSearch={handleSearch}
      />

      <ProjectForm
        open={isCreateProjectDialogOpen}
        onOpenChange={setIsCreateProjectDialogOpen}
      />

      {isPending ? <ProjectListSkeleton /> : null}

      {isError ? (
        <section
          aria-labelledby="projects-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <div className="space-y-1">
            <h2 className="font-semibold" id="projects-error-title">
              Could not load projects
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
          <h2 className="font-semibold">No projects found</h2>
          <p className="text-sm text-muted-foreground">
            You do not have any unarchived projects yet.
          </p>
        </section>
      ) : null}

      {!isPending && !isError && data && data.data.length > 0 ? (
        <>
          <ProjectList projects={data.data} />
          <ProjectPagination
            isFetching={isFetching}
            meta={data.meta}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}
    </main>
  );
}
