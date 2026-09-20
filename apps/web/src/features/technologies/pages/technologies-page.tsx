import { Cpu, FolderKanban, RefreshCw, Search } from "lucide-react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTechnologies } from "../hooks/use-technologies";

const perPage = 20;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function TechnologiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const name = searchParams.get("name")?.trim() ?? "";
  const page = parsePage(searchParams.get("page"));
  const query = useTechnologies({
    page,
    perPage,
    ...(name ? { name } : {}),
  });

  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      technologies: NonNullable<typeof query.data>["data"];
    }
  >();

  for (const technology of query.data?.data ?? []) {
    const group = groups.get(technology.projectId) ?? {
      id: technology.projectId,
      name: technology.projectName,
      technologies: [],
    };
    group.technologies.push(technology);
    groups.set(technology.projectId, group);
  }
  const projectGroups = [...groups.values()];

  function updateParams(next: { name?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    params.delete("name");
    params.delete("page");

    const nextName = next.name?.trim();
    if (nextName) params.set("name", nextName);
    params.set("page", String(next.page ?? 1));
    setSearchParams(params);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParams({ name: String(formData.get("name") ?? ""), page: 1 });
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Cpu className="size-8 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">
            Technologies
          </h1>
        </div>
        <p className="text-muted-foreground">
          Browse the technologies recorded across your projects.
        </p>
      </header>

      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
        <label className="sr-only" htmlFor="technology-search">
          Search technologies
        </label>
        <Input
          autoComplete="off"
          id="technology-search"
          key={name}
          name="name"
          placeholder="Search by technology name"
          defaultValue={name}
        />
        <Button type="submit">
          <Search data-icon="inline-start" />
          Search
        </Button>
        {name ? (
          <Button
            onClick={() => {
              updateParams({ page: 1 });
            }}
            type="button"
            variant="outline"
          >
            Clear
          </Button>
        ) : null}
      </form>

      {query.isFetching && !query.isPending ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="size-4 animate-spin" />
          Updating...
        </p>
      ) : null}

      {query.isPending ? (
        <div
          className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center"
          role="status"
        >
          <RefreshCw className="mx-auto size-5 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading technologies...
          </p>
        </div>
      ) : null}

      {query.isError ? (
        <section
          aria-labelledby="technologies-error-title"
          className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
          role="alert"
        >
          <div className="space-y-1">
            <h2 className="font-semibold" id="technologies-error-title">
              Could not load technologies
            </h2>
            <p className="text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
          </div>
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
          <Cpu className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-semibold">
            {name ? "No technologies found" : "No technologies yet"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {name
              ? "Try a different search term."
              : "Add technologies from a project to build your stack overview."}
          </p>
          {!name ? (
            <Button asChild className="mt-3" variant="outline">
              <Link to="/projects">Browse projects</Link>
            </Button>
          ) : null}
        </section>
      ) : null}

      {!query.isPending && !query.isError && projectGroups.length > 0 ? (
        <div className="space-y-6">
          {projectGroups.map((group) => (
            <section
              aria-labelledby={`technology-project-${group.id}`}
              className="space-y-4"
              key={group.id}
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2
                  className="flex items-center gap-2 text-xl font-semibold tracking-tight"
                  id={`technology-project-${group.id}`}
                >
                  <FolderKanban className="size-5 text-primary" />
                  {group.name}
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/projects/${group.id}`}>Open project</Link>
                </Button>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.technologies.map((technology) => (
                  <li key={technology.id}>
                    <article className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Cpu className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">
                          {technology.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {technology.version
                            ? `Version ${technology.version}`
                            : "Version not specified"}
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {query.data && query.data.meta.lastPage > 1 ? (
            <nav
              aria-label="Technology pagination"
              className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Page {query.data.meta.currentPage} of {query.data.meta.lastPage}{" "}
                · {query.data.meta.total.toLocaleString("en-US")}{" "}
                technology(ies)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => updateParams({ name, page: page - 1 })}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    page >= query.data.meta.lastPage || query.isFetching
                  }
                  onClick={() => updateParams({ name, page: page + 1 })}
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
