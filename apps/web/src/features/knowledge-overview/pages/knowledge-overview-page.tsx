import { BarChart3, CircleAlert, CircleCheck, Lightbulb } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useProjectOptions } from "@/features/projects/hooks/use-project-options";
import type {
  TechnicalEntryStatus,
  TechnicalEntryType,
} from "@/features/technical-entry/types/technical-entry";
import { IssueComposition } from "../components/issue-composition";
import { KnowledgeMetric } from "../components/knowledge-metric";
import { RecentKnowledge } from "../components/recent-knowledge";
import { useKnowledgeOverview } from "../hooks/use-knowledge-overview";

export default function KnowledgeOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId")?.trim() || undefined;
  const projects = useProjectOptions();
  const queries = useKnowledgeOverview(projectId);
  const isRefreshing = Object.values(queries).some(
    (query) => query.isFetching && !query.isPending,
  );

  function entriesLink(
    type: TechnicalEntryType,
    status?: TechnicalEntryStatus,
  ) {
    const params = new URLSearchParams({ type });
    if (status) params.set("status", status);
    if (projectId) params.set("projectId", projectId);
    return `/technical-entries?${params}`;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <BarChart3
            aria-hidden="true"
            className="size-8 shrink-0 text-primary"
          />
          <h1 className="text-3xl font-semibold tracking-tight">
            Knowledge Overview
          </h1>
        </div>
        <p className="text-muted-foreground">
          Explore what you have learned and the problems you have resolved.
        </p>
        <p className="text-sm text-muted-foreground">
          A snapshot of your current journal. Archived and deleted entries are
          excluded.
        </p>
      </header>

      <section
        aria-label="Knowledge filters"
        className="space-y-3 rounded-xl border bg-card p-4"
      >
        <div className="max-w-md space-y-2">
          <label className="text-sm font-medium" htmlFor="knowledge-project">
            Project
          </label>
          <select
            className="h-9 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm disabled:opacity-50"
            disabled={
              projects.isPending || (projects.isError && !projects.data)
            }
            id="knowledge-project"
            onChange={(event) =>
              setSearchParams(
                event.target.value ? { projectId: event.target.value } : {},
              )
            }
            value={projectId ?? ""}
          >
            <option value="">All projects</option>
            {projectId &&
            !projects.data?.some((project) => project.id === projectId) ? (
              <option value={projectId}>Selected project</option>
            ) : null}
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        {projects.isPending ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading projects...
          </p>
        ) : null}
        {projects.isError ? (
          <div className="space-y-2 text-sm" role="alert">
            <p>Could not load project filter options.</p>
            <Button
              disabled={projects.isFetching}
              onClick={() => projects.refetch()}
              size="sm"
              type="button"
              variant="outline"
            >
              Retry projects
            </Button>
          </div>
        ) : null}
        {projectId ? (
          <Button
            onClick={() => setSearchParams({})}
            size="sm"
            type="button"
            variant="outline"
          >
            Clear project filter
          </Button>
        ) : null}
      </section>

      {isRefreshing ? (
        <p className="text-sm text-muted-foreground" role="status">
          Updating overview...
        </p>
      ) : null}

      <section
        aria-label="Knowledge totals"
        className="grid gap-4 sm:grid-cols-3"
      >
        <KnowledgeMetric
          icon={Lightbulb}
          label="Learnings"
          query={queries.learnings}
          to={entriesLink("LEARNING")}
        />
        <KnowledgeMetric
          icon={CircleAlert}
          label="Open issues"
          query={queries.openIssues}
          to={entriesLink("ISSUE", "OPEN")}
        />
        <KnowledgeMetric
          icon={CircleCheck}
          label="Resolved issues"
          query={queries.resolvedIssues}
          to={entriesLink("ISSUE", "RESOLVED")}
        />
      </section>

      <IssueComposition
        openIssues={queries.openIssues}
        resolvedIssues={queries.resolvedIssues}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentKnowledge
          dateField="createdAt"
          emptyMessage="No learnings in this scope yet."
          id="recent-learnings-title"
          query={queries.recentLearnings}
          title="Recent learnings"
          to={entriesLink("LEARNING")}
        />
        <RecentKnowledge
          dateField="resolvedAt"
          emptyMessage="No resolved issues in this scope yet."
          id="recent-resolved-title"
          query={queries.recentResolvedIssues}
          title="Recently resolved issues"
          to={entriesLink("ISSUE", "RESOLVED")}
        />
      </div>
    </main>
  );
}
