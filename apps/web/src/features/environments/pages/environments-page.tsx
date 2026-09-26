import { Boxes, FolderKanban, RefreshCw, Search } from "lucide-react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnvironmentProjectOptions } from "../hooks/use-environment-project-options";
import { useEnvironments } from "../hooks/use-environments";
import {
  environmentCategoryLabel,
  environmentRuntimeSummary,
} from "../presentation";
import {
  environmentCategories,
  type ProjectEnvironmentCategory,
} from "../types/environment";

const perPage = 20;
function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
function isCategory(value: string | null): value is ProjectEnvironmentCategory {
  return environmentCategories.some((category) => category === value);
}

export default function EnvironmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const rawCategory = searchParams.get("category");
  const category = isCategory(rawCategory) ? rawCategory : "";
  const projectId = searchParams.get("projectId") ?? "";
  const page = parsePage(searchParams.get("page"));
  const sort = searchParams.get("sort") === "name" ? "name" : "projectName";
  const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
  const query = useEnvironments({
    page,
    perPage,
    sort,
    sortDir,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(projectId ? { projectId } : {}),
  });
  const projectsQuery = useEnvironmentProjectOptions();

  // URL parameters are the source of truth, including browser back/forward navigation.
  function updateParams(
    changes: Record<string, string | number | undefined>,
    resetPage = true,
  ) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    if (resetPage) params.set("page", "1");
    setSearchParams(params);
  }
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({
      search: String(
        new FormData(event.currentTarget).get("search") ?? "",
      ).trim(),
    });
  }
  const groups = new Map<
    string,
    { name: string; items: NonNullable<typeof query.data>["data"] }
  >();
  for (const environment of query.data?.data ?? []) {
    const group = groups.get(environment.projectId) ?? {
      name: environment.projectName,
      items: [],
    };
    group.items.push(environment);
    groups.set(environment.projectId, group);
  }
  const hasFilter = Boolean(search || category || projectId);
  const isPageOutOfRange =
    Boolean(query.data?.meta.total) && query.data?.data.length === 0;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Boxes className="size-8 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">
            Environments
          </h1>
        </div>
        <p className="text-muted-foreground">
          Browse the environments recorded across your projects.
        </p>
      </header>

      <div className="space-y-3">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="environment-search">
            Search environments
          </label>
          <Input
            autoComplete="off"
            defaultValue={search}
            id="environment-search"
            key={search}
            name="search"
            placeholder="Search name, operating system, or runtime"
          />
          <Button type="submit">
            <Search data-icon="inline-start" />
            Search
          </Button>
        </form>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            Category
            <select
              aria-label="Category"
              className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
              onChange={(event) =>
                updateParams({ category: event.target.value })
              }
              value={category}
            >
              <option value="">All categories</option>
              {environmentCategories.map((item) => (
                <option key={item} value={item}>
                  {environmentCategoryLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            Project
            <select
              aria-label="Project"
              className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
              onChange={(event) =>
                updateParams({ projectId: event.target.value })
              }
              value={projectId}
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
          </label>
          <label className="space-y-1 text-sm">
            Sort
            <select
              aria-label="Sort"
              className="h-9 w-full rounded-lg border border-input bg-card px-2.5 text-sm"
              onChange={(event) => {
                const [nextSort, nextDir] = event.target.value.split(":");
                updateParams({ sort: nextSort, sortDir: nextDir });
              }}
              value={`${sort}:${sortDir}`}
            >
              <option value="projectName:asc">Project A–Z</option>
              <option value="projectName:desc">Project Z–A</option>
              <option value="name:asc">Environment A–Z</option>
              <option value="name:desc">Environment Z–A</option>
            </select>
          </label>
        </div>
        {hasFilter ? (
          <Button
            onClick={() => {
              setSearchParams(new URLSearchParams({ page: "1" }));
            }}
            type="button"
            variant="outline"
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {query.isFetching && !query.isPending ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="size-4 animate-spin" />
          Updating environments...
        </p>
      ) : null}
      {query.isPending ? (
        <div
          className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center"
          role="status"
        >
          <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading environments...
          </p>
        </div>
      ) : null}
      {query.isError ? (
        <section
          aria-labelledby="environments-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="font-semibold" id="environments-error-title">
            Could not load environments
          </h2>
          <p className="text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button
            onClick={() => query.refetch()}
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </section>
      ) : null}
      {!query.isPending && !query.isError && query.data?.data.length === 0 ? (
        <section className="space-y-2 rounded-xl border border-dashed p-10 text-center">
          <Boxes className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-semibold">
            {isPageOutOfRange
              ? "No environments on this page"
              : hasFilter
                ? "No environments found"
                : "No environments yet"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPageOutOfRange
              ? "Choose an earlier page to see matching environments."
              : hasFilter
                ? "Try different filters."
                : "Add environments from a project to document its runtime contexts."}
          </p>
          {isPageOutOfRange ? (
            <Button
              onClick={() => updateParams({ page: 1 }, false)}
              type="button"
              variant="outline"
            >
              Go to first page
            </Button>
          ) : !hasFilter ? (
            <Button asChild className="mt-3" variant="outline">
              <Link to="/projects">Browse projects</Link>
            </Button>
          ) : null}
        </section>
      ) : null}
      {!query.isPending && !query.isError && groups.size > 0 ? (
        <div className="space-y-6">
          {[...groups.entries()].map(([id, group]) => (
            <section
              aria-labelledby={`environment-project-${id}`}
              className="space-y-4"
              key={id}
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  className="flex items-center gap-2 text-xl font-semibold tracking-tight"
                  id={`environment-project-${id}`}
                >
                  <FolderKanban className="size-5 text-primary" />
                  {group.name}
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/projects/${id}`}>Open project</Link>
                </Button>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((environment) => (
                  <li key={environment.id}>
                    <article className="space-y-2 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                      <h3 className="font-medium">{environment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {environmentCategoryLabel(environment.category)}
                      </p>
                      <p className="text-sm">
                        {environment.operatingSystem ||
                          "Operating system not specified"}{" "}
                        ·{" "}
                        {environmentRuntimeSummary(
                          environment.runtime,
                          environment.runtimeVersion,
                        )}
                      </p>
                      {environment.description ? (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {environment.description}
                        </p>
                      ) : null}
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {query.data && query.data.meta.lastPage > 1 ? (
            <nav
              aria-label="Environment pagination"
              className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Page {query.data.meta.currentPage} of {query.data.meta.lastPage}{" "}
                · {query.data.meta.total.toLocaleString("en-US")} environment(s)
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => updateParams({ page: page - 1 }, false)}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    page >= query.data.meta.lastPage || query.isFetching
                  }
                  onClick={() => updateParams({ page: page + 1 }, false)}
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
