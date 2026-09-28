import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import type { KnowledgeQuery } from "../hooks/use-knowledge-overview";

export function RecentKnowledge({
  title,
  id,
  query,
  to,
  dateField,
  emptyMessage,
}: {
  title: string;
  id: string;
  query: KnowledgeQuery;
  to: string;
  dateField: "createdAt" | "resolvedAt";
  emptyMessage: string;
}) {
  const isResolved = dateField === "resolvedAt";

  return (
    <section
      aria-labelledby={id}
      className="min-w-0 space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-semibold" id={id}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isResolved
            ? "The five most recently resolved issues."
            : "The five most recently created learnings."}
        </p>
      </header>
      {query.isError ? (
        <div className="space-y-3" role="alert">
          <p className="text-sm">Could not load {title.toLowerCase()}.</p>
          <Button
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry {title.toLowerCase()}
          </Button>
        </div>
      ) : query.isPending ? (
        <p
          aria-label={`Loading ${title.toLowerCase()}`}
          className="text-sm text-muted-foreground"
          role="status"
        >
          Loading...
        </p>
      ) : query.data.data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ol className="divide-y">
          {query.data.data.map((entry) => {
            const date = entry[dateField];
            return (
              <li className="space-y-1 py-3 first:pt-0" key={entry.id}>
                <Link
                  className="rounded-sm font-medium wrap-anywhere underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  to={`/technical-entries/${entry.id}`}
                >
                  {entry.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {isResolved ? "Resolved" : "Created"}{" "}
                  {date ? (
                    <time dateTime={date}>{formatDate(date)}</time>
                  ) : (
                    "date unavailable"
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      )}
      <Button asChild size="sm" variant="outline">
        <Link to={to}>
          View all {isResolved ? "resolved issues" : "learnings"}
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Link>
      </Button>
    </section>
  );
}
