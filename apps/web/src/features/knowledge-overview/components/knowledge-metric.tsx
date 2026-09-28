import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { KnowledgeQuery } from "../hooks/use-knowledge-overview";

export function KnowledgeMetric({
  label,
  icon: Icon,
  query,
  to,
}: {
  label: string;
  icon: LucideIcon;
  query: KnowledgeQuery;
  to: string;
}) {
  return (
    <article
      aria-label={label}
      className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
      {query.isError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm">Could not load this total.</p>
          <Button
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry {label.toLowerCase()}
          </Button>
        </div>
      ) : query.isPending ? (
        <p
          aria-label={`Loading ${label.toLowerCase()} total`}
          className="text-sm text-muted-foreground"
          role="status"
        >
          Loading...
        </p>
      ) : (
        <p className="text-3xl font-semibold tracking-tight">
          {query.data.meta.total.toLocaleString("en-US")}
        </p>
      )}
      <Link
        className="inline-block rounded-sm text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to={to}
      >
        Explore {label.toLowerCase()}
      </Link>
    </article>
  );
}
