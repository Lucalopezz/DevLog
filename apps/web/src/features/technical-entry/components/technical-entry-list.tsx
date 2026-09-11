import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { formatRelativeDate } from "@/lib/date";
import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from "../presentation";
import type { TechnicalEntry } from "../types/technical-entry";

export function TechnicalEntryList({
  entries,
}: {
  entries: TechnicalEntry[];
}) {
  return (
    <section aria-labelledby="technical-entries-list-title" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold" id="technical-entries-list-title">
          Your technical entries
        </h2>
        <p className="text-sm text-muted-foreground">
          Issues and learnings from your technical journal.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const type = presentTechnicalEntryType(entry.type);
          const status = entry.status
            ? presentTechnicalEntryStatus(entry.status)
            : null;
          const TypeIcon = type.icon;

          return (
            <li key={entry.id}>
              <Link
                className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                to={`/technical-entries/${entry.id}`}
              >
                <article className="flex h-full flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm transition-colors group-hover:border-primary/40 group-hover:bg-card/80">
                  <header className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${type.className}`}
                      >
                        <TypeIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {type.label}
                        </p>
                        <h3 className="mt-1 flex items-start gap-1 break-words font-semibold">
                          <span>{entry.title}</span>
                          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </h3>
                      </div>
                    </div>

                    {status ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    ) : null}
                  </header>

                  <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {entry.context}
                  </p>

                  {entry.tags?.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <li
                          className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                          key={tag.id}
                        >
                          #{tag.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <time
                    className="mt-auto text-xs text-muted-foreground"
                    dateTime={entry.updatedAt}
                  >
                    Updated {formatRelativeDate(entry.updatedAt)}
                  </time>
                </article>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
