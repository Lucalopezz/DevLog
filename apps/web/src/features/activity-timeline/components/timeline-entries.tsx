import { FolderKanban } from "lucide-react";
import { Link } from "react-router";
import type { Project } from "@/features/projects/types/project";
import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from "@/features/technical-entry/presentation";
import { formatDate } from "@/lib/date";
import type { TimelineDay } from "../group-entries-by-day";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export function TimelineEntries({
  days,
  projects,
  isLoadingProjects,
}: {
  days: TimelineDay[];
  projects: Project[];
  isLoadingProjects: boolean;
}) {
  const projectNames = new Map(
    projects.map((project) => [project.id, project.name]),
  );

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <section aria-labelledby={`timeline-day-${day.date}`} key={day.date}>
          <h2
            className="mb-4 text-lg font-semibold"
            id={`timeline-day-${day.date}`}
          >
            <time dateTime={day.date}>
              {formatDate(day.entries[0].createdAt)}
            </time>
          </h2>
          <ol className="ml-4 space-y-4 border-l pl-6 sm:pl-8">
            {day.entries.map((entry) => {
              const type = presentTechnicalEntryType(entry.type);
              const TypeIcon = type.icon;
              const status =
                entry.type === "ISSUE" && entry.status
                  ? presentTechnicalEntryStatus(entry.status)
                  : undefined;

              return (
                <li className="relative" key={entry.id}>
                  <span className="absolute -left-10 top-4 flex size-8 items-center justify-center rounded-full border bg-background sm:-left-12">
                    <TypeIcon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                  </span>
                  <article className="min-w-0 space-y-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <time
                        className="text-muted-foreground"
                        dateTime={entry.createdAt}
                      >
                        {timeFormatter.format(new Date(entry.createdAt))}
                      </time>
                      <span
                        className={`rounded-md px-2 py-1 font-medium ${type.className}`}
                      >
                        {type.label}
                      </span>
                      {status ? (
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium ${status.className}`}
                        >
                          Current status: {status.label}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold wrap-anywhere">
                      <Link
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        to={`/technical-entries/${entry.id}`}
                      >
                        {entry.title}
                      </Link>
                    </h3>
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                      <FolderKanban
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span className="min-w-0 wrap-anywhere">
                        {entry.projectId
                          ? (projectNames.get(entry.projectId) ??
                            (isLoadingProjects
                              ? "Loading project..."
                              : "Project unavailable"))
                          : "No project"}
                      </span>
                    </p>
                    {entry.tags?.length ? (
                      <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag) => (
                          <li
                            className="max-w-full rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground wrap-anywhere"
                            key={tag.id}
                          >
                            #{tag.name}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
