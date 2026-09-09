import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  MapPin,
  Pencil,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { presentProjectStatus } from "../presentation";
import type { Project } from "../types/project";

export function ProjectDetailHeader({
  onEdit,
  project,
}: {
  onEdit: () => void;
  project: Project;
}) {
  const status = presentProjectStatus(project.status);

  return (
    <header className="space-y-6">
      <Button asChild className="-ml-2" size="sm" variant="ghost">
        <Link to="/projects">
          <ArrowLeft data-icon="inline-start" />
          Back to projects
        </Link>
      </Button>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <FolderKanban className="size-7" />
          </div>

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
              {project.archivedAt ? (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  Archived
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="break-words text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {project.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {project.description ||
                  "A space to organize decisions, references, and lessons learned in this project."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 gap-3 sm:min-w-48">
          <Button
            disabled={Boolean(project.archivedAt)}
            onClick={onEdit}
            size="sm"
            type="button"
            variant="outline"
          >
            <Pencil data-icon="inline-start" />
            Edit project
          </Button>

          <dl className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              <dt className="sr-only">Created on</dt>
              <dd>
                Created on{' '}
                <time dateTime={project.createdAt}>
                  {formatDate(project.createdAt)}
                </time>
              </dd>
            </div>
            {project.localPath ? (
              <div className="flex min-w-0 items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <dt className="sr-only">Local path</dt>
                <dd
                  className="truncate font-mono text-xs"
                  title={project.localPath}
                >
                  {project.localPath}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </header>
  );
}
