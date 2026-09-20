import { ArrowUpRight, ExternalLink, Terminal } from "lucide-react";
import type { Meta } from "@/api/types";
import { formatRelativeDate } from "@/lib/date";
import { Link } from "react-router";
import { presentTechnicalEntryType } from "@/features/technical-entry/presentation";
import type { ProjectCommand, ProjectResource } from "../types/project-detail";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";
import { resourcePresentation } from "../presentation";
import { Button } from "@/components/ui/button";
import { ProjectCommandDeleteButton } from "./project-command-delete-btn";
import {
  DetailPagination,
  EmptySection,
  LoadingSection,
  SectionError,
} from "./project-detail-section-ui";

function isSafeResourceUrl(value: string) {
  try {
    // An API response is still untrusted input for an href. Only HTTP(S)
    // resources should become links; other schemes remain readable text.
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function TechnicalEntriesSection({
  entries,
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
}: {
  entries?: TechnicalEntry[];
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}) {
  // The response can be pending, empty, or failed. Handling these states
  // here keeps the page focused on composition and allows retries per section.
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!entries?.length) {
    return (
      <EmptySection>
        No technical entries have been recorded for this project.
      </EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const type = presentTechnicalEntryType(entry.type);
          const TypeIcon = type.icon;

          return (
            // A single anchor makes every part of the card a keyboard-accessible
            // navigation target and avoids nesting the title link inside it.
            <Link
              className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              key={entry.id}
              to={`/technical-entries/${entry.id}`}
            >
              <article className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-colors group-hover:border-primary/40 group-hover:bg-card">
                <header className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TypeIcon className="size-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {type.label}
                      </p>
                      <h3 className="mt-1 flex items-start gap-1 break-words font-semibold">
                        <span>{entry.title}</span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </h3>
                    </div>
                  </div>
                  {entry.status ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {entry.status === "RESOLVED" ? "Resolved" : "Open"}
                    </span>
                  ) : null}
                </header>

                <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {entry.context}
                </p>

                {entry.conclusion ? (
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {entry.conclusion}
                  </p>
                ) : null}

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
          );
        })}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export function CommandsSection({
  commands,
  isArchived,
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
  onEdit,
  onDeleted,
  projectId,
}: {
  commands?: ProjectCommand[];
  isArchived: boolean;
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onEdit: (command: ProjectCommand) => void;
  onDeleted: () => void;
  projectId: string;
}) {
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!commands?.length) {
    return (
      <EmptySection>
        No commands have been recorded for this project.
      </EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {commands.map((command, index) => (
          <article
            className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
            key={command.id}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Terminal className="size-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {command.executionOrder ?? index + 1}. Command
                  </p>
                  <h3 className="mt-1 break-words font-semibold">
                    {command.title}
                  </h3>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={command.updatedAt}
                >
                  {formatRelativeDate(command.updatedAt)}
                </time>
                <div className="flex items-center gap-2">
                  <Button
                    aria-label={`Edit ${command.title}`}
                    disabled={isArchived}
                    onClick={() => onEdit(command)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <ProjectCommandDeleteButton
                    commandId={command.id}
                    disabled={isArchived}
                    onDeleted={onDeleted}
                    projectId={projectId}
                    title={command.title}
                  />
                </div>
              </div>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground p-4 text-sm leading-6 text-background">
              <code>{command.command}</code>
            </pre>
            {command.description ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {command.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}
export function ResourcesSection({
  isError,
  isFetching,
  meta,
  isPending,
  onRetry,
  onPageChange,
  resources,
}: {
  isError: boolean;
  isFetching: boolean;
  meta?: Meta;
  isPending: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  resources?: ProjectResource[];
}) {
  if (isError) return <SectionError onRetry={onRetry} />;
  if (isPending) return <LoadingSection />;
  if (!resources?.length) {
    return (
      <EmptySection>
        No resources have been recorded for this project.
      </EmptySection>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => {
          const presentation = resourcePresentation[resource.type];
          const ResourceIcon = presentation.icon;
          const isExternal = isSafeResourceUrl(resource.url);

          return (
            <a
              className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-card"
              href={isExternal ? resource.url : undefined}
              key={resource.id}
              rel={isExternal ? "noreferrer" : undefined}
              target={isExternal ? "_blank" : undefined}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <ResourceIcon className="size-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {presentation.label}
                  <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-1 block truncate font-medium">
                  {resource.label}
                </span>
                <span
                  className="mt-1 block truncate font-mono text-xs text-muted-foreground"
                  title={resource.url}
                >
                  {resource.url}
                </span>
              </span>
            </a>
          );
        })}
      </div>
      <DetailPagination
        isFetching={isFetching}
        meta={meta}
        onPageChange={onPageChange}
      />
    </div>
  );
}
