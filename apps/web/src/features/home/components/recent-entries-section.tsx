import { ArrowRight, BookOpenText } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from "@/features/technical-entry/presentation";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";
import { formatRelativeDate } from "@/lib/date";

type RecentEntriesSectionProps = {
  entries?: TechnicalEntry[];
  isPending: boolean;
  isError: boolean;
};

function RecentEntryRow({ entry }: { entry: TechnicalEntry }) {
  const type = presentTechnicalEntryType(entry.type);
  const status = entry.status
    ? presentTechnicalEntryStatus(entry.status)
    : null;
  const TypeIcon = type.icon;

  return (
    <li>
      <Link
        className="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        to={`/technical-entries/${entry.id}`}
      >
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${type.className}`}
        >
          <TypeIcon aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{entry.title}</span>
            {status ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {type.label} · Updated {formatRelativeDate(entry.updatedAt)}
          </span>
        </span>
        <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </li>
  );
}

export function RecentEntriesSection({
  entries,
  isPending,
  isError,
}: RecentEntriesSectionProps) {
  return (
    <section
      aria-labelledby="recent-entries-title"
      className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6"
    >
      <header className="mb-4 flex items-end justify-between gap-4 px-2">
        <div>
          <p className="text-xs font-medium tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
            Latest activity
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            id="recent-entries-title"
          >
            Recent journal entries
          </h2>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link to="/technical-entries">
            View all
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </header>

      {isPending ? (
        <div
          aria-label="Loading recent entries"
          className="space-y-3 px-2"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <div className="flex items-center gap-4 rounded-xl p-3" key={item}>
              <span className="size-9 animate-pulse rounded-xl bg-muted" />
              <span className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl bg-muted/60 p-5 text-sm text-muted-foreground">
          Recent entries are unavailable right now.
        </p>
      ) : entries?.length ? (
        <ul className="divide-y">
          {entries.map((entry) => (
            <RecentEntryRow entry={entry} key={entry.id} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <BookOpenText className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-medium">Your journal is ready</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Record your first issue or learning to start building context.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/technical-entries">Create an entry</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
