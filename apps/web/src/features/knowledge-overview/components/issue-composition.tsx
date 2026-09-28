import type { KnowledgeQuery } from "../hooks/use-knowledge-overview";

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function IssueComposition({
  openIssues,
  resolvedIssues,
}: {
  openIssues: KnowledgeQuery;
  resolvedIssues: KnowledgeQuery;
}) {
  // Missing/failed data is not zero. Derive the ratio only when both requests
  // succeeded; zero issues is a separate, valid state with no defined ratio.
  const hasError = openIssues.isError || resolvedIssues.isError;
  const counts =
    openIssues.isSuccess && resolvedIssues.isSuccess
      ? {
          open: openIssues.data.meta.total,
          resolved: resolvedIssues.data.meta.total,
        }
      : undefined;
  const total = counts ? counts.open + counts.resolved : 0;
  const ratio = counts && total > 0 ? counts.resolved / total : undefined;

  return (
    <section
      aria-labelledby="issue-composition-title"
      className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold" id="issue-composition-title">
          Issue composition
        </h2>
        <p className="text-sm text-muted-foreground">
          Current issue status, not a measure of productivity or historical
          progress.
        </p>
      </div>
      {hasError ? (
        <p className="text-sm" role="alert">
          Issue composition is unavailable. Retry the failed issue totals above.
        </p>
      ) : !counts ? (
        <p
          aria-label="Loading issue composition"
          className="text-sm text-muted-foreground"
          role="status"
        >
          Loading issue totals...
        </p>
      ) : ratio === undefined ? (
        <div className="space-y-2">
          <p
            className="text-3xl font-semibold"
            aria-label="Resolved issues percentage unavailable"
          >
            —
          </p>
          <p className="text-sm text-muted-foreground">
            There are no issues in this scope, so a resolved percentage cannot
            be calculated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight">
              {percentFormatter.format(ratio)}
            </span>
            <span className="text-sm text-muted-foreground">
              of issues resolved
            </span>
          </p>
          {/* A meter describes a proportion of the current collection. It is
              not a progress bar for a task or a target the user must reach. */}
          <div
            aria-label="Resolved share of issues"
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={counts.resolved}
            aria-valuetext={`${percentFormatter.format(ratio)} resolved; ${counts.open.toLocaleString("en-US")} open and ${counts.resolved.toLocaleString("en-US")} resolved issues`}
            className="flex h-3 overflow-hidden rounded-full bg-muted"
            role="meter"
          >
            <span
              className="bg-sky-500"
              style={{ width: `${(1 - ratio) * 100}%` }}
            />
            <span
              className="bg-emerald-500"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-sky-500"
              />
              {counts.open.toLocaleString("en-US")} open
            </p>
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full bg-emerald-500"
              />
              {counts.resolved.toLocaleString("en-US")} resolved
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
