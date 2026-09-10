import {
  CalendarDays,
  Check,
  Copy,
  FolderKanban,
  LockKeyhole,
  MapPin,
  Pencil,
  Settings2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";
import { presentProjectStatus } from "../presentation";
import type { Project } from "../types/project";
import { ArchiveProjectButton } from "./project-archive-btn";
import { DeleteProjectButton } from "./project-delete-btn";
import { RestoreProjectButton } from "./project-restore-btn";

type ProjectSettingsPaneProps = {
  project: Project;
  onEdit: () => void;
};

export function ProjectSettingsPane({
  project,
  onEdit,
}: ProjectSettingsPaneProps) {
  const isArchived = Boolean(project.archivedAt);
  const status = presentProjectStatus(project.status);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Project settings</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Manage project information, lifecycle, and data.
            </p>
          </div>
        </div>
        {isArchived ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <LockKeyhole className="size-3.5" />
            Read-only
          </span>
        ) : null}
      </header>

      {isArchived ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <p>
            This project is archived and read-only. Restore it before making
            changes or deleting it.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold">General</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Update the basic information used to identify this project.
            </p>
          </div>
          <Button
            disabled={isArchived}
            onClick={onEdit}
            size="sm"
            type="button"
            variant="outline"
          >
            <Pencil data-icon="inline-start" />
            Edit project
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
          <MetadataItem label="Status">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </MetadataItem>
          <MetadataItem label="Project ID">
            <CopyableValue value={project.id} />
          </MetadataItem>
          <MetadataItem label="Created on">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatDate(project.createdAt)}
            </span>
          </MetadataItem>
          <MetadataItem label="Last updated">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatDate(project.updatedAt)}
            </span>
          </MetadataItem>
        </dl>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FolderKanban className="size-4" />
          </span>
          <div>
            <h3 className="font-semibold">Project location</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The local directory associated with this project.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-4">
          {project.localPath ? (
            <div className="flex min-w-0 items-center gap-3">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <code className="min-w-0 flex-1 truncate text-xs" title={project.localPath}>
                {project.localPath}
              </code>
              <CopyableValue compact value={project.localPath} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No local path has been configured.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6">
        <div>
          <h3 className="font-semibold">Lifecycle</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Archive projects that are no longer active without losing their data.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{isArchived ? "Archived project" : "Active project"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isArchived
                ? "Restore it to make changes again."
                : "Archive it to keep it out of your active project list."}
            </p>
          </div>
          {isArchived ? (
            <RestoreProjectButton projectId={project.id} />
          ) : (
            <ArchiveProjectButton projectId={project.id} />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
        <div>
          <h3 className="font-semibold text-destructive">Danger zone</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Permanently delete this project and its commands, resources, and
            technologies. This action cannot be undone.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-destructive/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {isArchived
              ? "Restore the project before deleting it."
              : "You will need to type the project name to confirm."}
          </p>
          <DeleteProjectButton
            disabled={isArchived}
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </section>
    </div>
  );
}

function MetadataItem({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

function CopyableValue({
  compact = false,
  value,
}: {
  compact?: boolean;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy this value.");
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {!compact ? (
        <code className="min-w-0 truncate text-xs" title={value}>
          {value}
        </code>
      ) : null}
      <Button
        aria-label={copied ? "Copied" : "Copy value"}
        onClick={handleCopy}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        {copied ? <Check className="text-emerald-600" /> : <Copy />}
      </Button>
    </div>
  );
}
