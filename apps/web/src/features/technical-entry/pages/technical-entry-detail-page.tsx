import { CalendarDays, Hash, Tags } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeDate } from "@/lib/date";
import { useGetTechnicalEntry } from "../hooks/use-get-technical-entry";
import { TechnicalEntryDetailHeader } from "../components/technical-entry-detail-header";
import { TechnicalEntryEditForm } from "../components/technical-entry-edit-form";
import { TechnicalEntryInlineContent } from "../components/technical-entry-inline-content";
import { TechnicalEntryDetailSkeleton } from "../components/technical-entry-detail-skeleton";
import { DeleteTechnicalEntryButton } from "../components/technical-entry-delete-btn";
import { ArchiveTechnicalEntryButton } from "../components/technical-entry-archive-btn";
import { RestoreTechnicalEntryButton } from "../components/technical-entry-restore-btn";
import {
  presentTechnicalEntryStatus,
  presentTechnicalEntryType,
} from "../presentation";

export default function TechnicalEntryDetailPage() {
  const { technicalEntryId = "" } = useParams<{
    technicalEntryId: string;
  }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const entryQuery = useGetTechnicalEntry(technicalEntryId);

  if (entryQuery.isPending) return <TechnicalEntryDetailSkeleton />;

  if (entryQuery.isError || !entryQuery.data) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center justify-center">
        <section
          aria-labelledby="technical-entry-detail-error-title"
          className="w-full space-y-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center"
          role="alert"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Hash className="size-6" />
          </div>
          <div className="space-y-2">
            <h1
              className="text-xl font-semibold"
              id="technical-entry-detail-error-title"
            >
              Technical entry not found
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              The entry may have been removed or may not belong to your account.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/technical-entries">Back to technical entries</Link>
          </Button>
        </section>
      </main>
    );
  }

  const entry = entryQuery.data;
  const type = presentTechnicalEntryType(entry.type);
  const status = entry.status
    ? presentTechnicalEntryStatus(entry.status)
    : null;
  const TypeIcon = type.icon;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8">
      <TechnicalEntryDetailHeader
        entry={entry}
        onEdit={() => setIsEditDialogOpen(true)}
      />
      <TechnicalEntryEditForm
        key={`${entry.id}:${entry.updatedAt}`}
        entry={entry}
        onOpenChange={setIsEditDialogOpen}
        open={isEditDialogOpen}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="min-w-0 space-y-5">
          <section className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <TypeIcon className="size-5 text-primary" />
              </span>
              <div>
                <h2 className="font-semibold">Context</h2>
                <p className="text-sm text-muted-foreground">
                  What was happening and why it mattered.
                </p>
              </div>
            </div>
            <TechnicalEntryInlineContent
              emptyMessage="Context is required."
              entry={entry}
              field="context"
              label="Context"
              placeholder="Describe what happened, where it happened, and what you tried."
            />
          </section>

          <section className="min-w-0 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Tags className="size-5 text-primary" />
              </span>
              <div>
                <h2 className="font-semibold">Conclusion</h2>
                <p className="text-sm text-muted-foreground">
                  The resulting decision or lesson.
                </p>
              </div>
            </div>
            <TechnicalEntryInlineContent
              emptyMessage="No conclusion has been recorded yet."
              entry={entry}
              field="conclusion"
              label="Conclusion"
              placeholder="What did you learn or how did you solve it?"
            />
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h2 className="font-semibold">Entry details</h2>
            <dl className="mt-5 grid gap-4 border-t border-border/60 pt-5 text-sm">
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${type.className}`}>
                    {type.label}
                  </span>
                </dd>
              </div>
              {status ? (
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">Created on</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd className="mt-1 font-medium">
                  <time dateTime={entry.updatedAt}>
                    {formatRelativeDate(entry.updatedAt)}
                  </time>
                </dd>
              </div>
            </dl>
          </section>

          {entry.tags?.length ? (
            <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
              <h2 className="font-semibold">Tags</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <li
                    className="rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                    key={tag.id}
                  >
                    #{tag.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h2 className="font-semibold">Entry lifecycle</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {entry.archivedAt
                ? "Restore this entry to include it in your default journal lists."
                : "Archive this entry to keep its history without showing it in default lists."}
            </p>
            <div className="mt-5 border-t border-border/60 pt-5">
              {entry.archivedAt ? (
                <RestoreTechnicalEntryButton technicalEntryId={entry.id} />
              ) : (
                <ArchiveTechnicalEntryButton technicalEntryId={entry.id} />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="font-semibold text-destructive">Danger zone</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Permanently delete this technical entry and its solution attempts.
            </p>
            <div className="mt-5 border-t border-destructive/15 pt-5">
              <DeleteTechnicalEntryButton
                technicalEntryId={entry.id}
                title={entry.title}
              />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
