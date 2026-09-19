import {
  BookOpenText,
  CircleAlert,
  FolderKanban,
  Hash,
  type LucideIcon,
} from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value?: number;
  description: string;
  isPending: boolean;
};

type WorkspaceSummaryProps = {
  projects: { total?: number; isPending: boolean };
  entries: { total?: number; isPending: boolean };
  openIssues: { total?: number; isPending: boolean };
  tags: { total?: number; isPending: boolean };
};

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  isPending,
}: MetricCardProps) {
  return (
    <article className="group rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isPending ? (
            <span
              aria-label={`Loading ${label.toLowerCase()}`}
              className="block h-9 w-14 animate-pulse rounded-md bg-muted"
              role="status"
            />
          ) : (
            <p className="text-3xl font-semibold tracking-tight">
              {value ?? "—"}
            </p>
          )}
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{description}</p>
    </article>
  );
}

export function WorkspaceSummary({
  projects,
  entries,
  openIssues,
  tags,
}: WorkspaceSummaryProps) {
  return (
    <section
      aria-label="Workspace summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        description="Unarchived workspaces"
        icon={FolderKanban}
        isPending={projects.isPending}
        label="Projects"
        value={projects.total}
      />
      <MetricCard
        description="Journal records"
        icon={BookOpenText}
        isPending={entries.isPending}
        label="Entries"
        value={entries.total}
      />
      <MetricCard
        description="Waiting for a conclusion"
        icon={CircleAlert}
        isPending={openIssues.isPending}
        label="Open issues"
        value={openIssues.total}
      />
      <MetricCard
        description="Knowledge categories"
        icon={Hash}
        isPending={tags.isPending}
        label="Tags"
        value={tags.total}
      />
    </section>
  );
}
