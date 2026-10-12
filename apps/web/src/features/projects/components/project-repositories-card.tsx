import { ExternalLink, GitBranch } from "lucide-react";
import { useProjectRepositories } from "../hooks/use-project-details";
import { isSafeResourceUrl } from "../presentation";
import { SectionError } from "./project-detail-section-ui";

export function ProjectRepositoriesCard({ projectId }: { projectId: string }) {
  // The card mounts only in Overview. Query owns the remote state and reuses
  // resource invalidation; the Resources tab keeps its independent pagination.
  const repositoriesQuery = useProjectRepositories(projectId);

  return (
    <section
      aria-labelledby="project-repositories-title"
      className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <GitBranch aria-hidden="true" className="size-5 text-primary" />
        </span>
        <div>
          <h2 className="font-semibold" id="project-repositories-title">
            Repositories
          </h2>
          <p className="text-sm text-muted-foreground">Project source code</p>
        </div>
      </div>

      {repositoriesQuery.isError ? (
        <SectionError onRetry={() => repositoriesQuery.refetch()} />
      ) : repositoriesQuery.isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading repositories...
        </p>
      ) : repositoriesQuery.data.length ? (
        <ul className="space-y-2">
          {repositoriesQuery.data.map((repository) => {
            const content = (
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium">
                  {repository.label}
                </span>
                <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                  {repository.url}
                </span>
              </span>
            );

            return (
              <li key={repository.id}>
                {isSafeResourceUrl(repository.url) ? (
                  <a
                    aria-label={`${repository.label} (opens in a new tab)`}
                    className="flex min-w-0 items-start gap-3 rounded-lg border border-border/60 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    href={repository.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {content}
                    <ExternalLink
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                  </a>
                ) : (
                  <div className="flex min-w-0 rounded-lg border border-border/60 bg-background/70 p-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          No repositories have been recorded for this project.
        </p>
      )}
    </section>
  );
}
