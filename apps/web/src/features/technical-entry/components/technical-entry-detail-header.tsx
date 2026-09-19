import { ArrowLeft, CalendarDays, FolderKanban, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { TechnicalEntryEditForm } from "./technical-entry-edit-form";
import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from "../presentation";
import type { TechnicalEntry } from "../types/technical-entry";

export function TechnicalEntryDetailHeader({
  entry,
  onStatusClick,
}: {
  entry: TechnicalEntry;
  onStatusClick: () => void;
}) {
  const type = presentTechnicalEntryType(entry.type);
  const status = entry.status
    ? presentTechnicalEntryStatus(entry.status)
    : null;
  const TypeIcon = type.icon;

  return (
    <header className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild className="-ml-2" size="sm" variant="ghost">
          <Link to="/technical-entries">
            <ArrowLeft data-icon="inline-start" />
            Back to technical entries
          </Link>
        </Button>
        {entry.status === "RESOLVED" ? null : (
          <EditTechnicalEntryAction entry={entry} />
        )}
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-primary/10 ${type.className}`}
          >
            <TypeIcon className="size-7" />
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${type.className}`}
              >
                {type.label}
              </span>
              {status ? (
                <button
                  aria-label={`Change status, currently ${status.label}`}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${status.className}`}
                  onClick={onStatusClick}
                  type="button"
                >
                  {status.label}
                </button>
              ) : null}
              {entry.archivedAt ? (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Archived
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="break-words text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {entry.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {type.description}
              </p>
            </div>
          </div>
        </div>

        <dl className="grid shrink-0 gap-3 text-sm text-muted-foreground sm:min-w-48">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            <dt className="sr-only">Created on</dt>
            <dd>
              Created on{" "}
              <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
            </dd>
          </div>
          {entry.projectId ? (
            <div className="flex min-w-0 items-center gap-2">
              <FolderKanban className="size-4 shrink-0" />
              <dt className="sr-only">Project</dt>
              <dd className="min-w-0 truncate">
                <Link
                  className="text-primary underline-offset-4 hover:underline"
                  to={`/projects/${entry.projectId}`}
                >
                  View project
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </header>
  );
}

function EditTechnicalEntryAction({ entry }: { entry: TechnicalEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        <Pencil data-icon="inline-start" />
        Edit entry
      </Button>
      <TechnicalEntryEditForm
        key={`${entry.id}:${entry.updatedAt}`}
        entry={entry}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}
