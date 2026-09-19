import { useState, type MouseEvent } from "react";
import { AlertTriangle, Loader2, Pencil, Trash2 } from "lucide-react";
import { useAddSolutionAttempt } from "../hooks/use-add-solution-attempt";
import { useAddSolutionAttemptForm } from "../hooks/use-add-solution-attempt-form";
import { useDeleteSolutionAttempt } from "../hooks/use-delete-solution-attempt";
import { useResolveTechnicalIssue } from "../hooks/use-technical-entry-lifecycle";
import { useSolutionAttempts } from "../hooks/use-solution-attempt";
import { useUpdateSolutionAttempt } from "../hooks/use-update-solution-attempt";
import { SolutionAttemptPagination } from "./solution-attempt-pagination";
import { updateSolutionAttemptSchema } from "../schemas/solution-attempt.schema";
import type { AddSolutionAttemptFormOutput } from "../schemas/solution-attempt.schema";
import type { TechnicalEntry } from "../types/technical-entry";
import type {
  SolutionAttempt,
  SolutionAttemptResult,
} from "../types/solution-attempt";
import { formatRelativeDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  entry: TechnicalEntry;
};

const resultLabels: Record<SolutionAttemptResult, string> = {
  FAILED: "Did not work",
  PARTIAL: "Partially worked",
  SUCCESSFUL: "Solved the issue",
};

export function TechnicalEntrySolutionAttempts({ entry }: Props) {
  const [page, setPage] = useState(1);
  const [editingAttemptId, setEditingAttemptId] = useState<string>();
  const [deletingAttemptId, setDeletingAttemptId] = useState<string>();
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [descriptionError, setDescriptionError] = useState<string>();
  const attemptsQuery = useSolutionAttempts(entry.id, { page });
  const addMutation = useAddSolutionAttempt();
  const resolveMutation = useResolveTechnicalIssue();
  const deleteMutation = useDeleteSolutionAttempt();
  const updateMutation = useUpdateSolutionAttempt();
  const form = useAddSolutionAttemptForm();

  const isResolved = entry.status === "RESOLVED";
  const canAddAttempt = !entry.archivedAt && !isResolved;
  const isSubmitting =
    form.formState.isSubmitting ||
    addMutation.isPending ||
    resolveMutation.isPending;

  function handleStartEditing(attempt: SolutionAttempt) {
    // Read the latest server value when editing starts instead of keeping a
    // draft that may have gone stale after a refetch.
    setDescriptionDraft(attempt.description);
    setDescriptionError(undefined);
    setEditingAttemptId(attempt.id);
  }

  function handleCancelEditing() {
    setEditingAttemptId(undefined);
    setDescriptionDraft("");
    setDescriptionError(undefined);
  }

  async function handleSaveDescription(attemptId: string) {
    const parsed = updateSolutionAttemptSchema.safeParse({
      description: descriptionDraft,
    });

    if (!parsed.success) {
      setDescriptionError(
        parsed.error.issues[0]?.message ?? "Description is required.",
      );
      return;
    }

    try {
      // The schema trims and validates the draft before it crosses the API
      // boundary. The result stays outside this editor and cannot be changed.
      await updateMutation.mutateAsync({
        technicalEntryId: entry.id,
        attemptId,
        input: parsed.data,
      });
      handleCancelEditing();
    } catch {
      // The mutation hook shows the API error; preserve the draft for retries.
    }
  }

  async function handleDeleteAttempt(
    event: MouseEvent<HTMLButtonElement>,
    attemptId: string,
  ) {
    // AlertDialogAction closes by default. Prevent that until the API confirms
    // deletion so a failed request leaves the confirmation available to retry.
    event.preventDefault();
    const shouldMoveToPreviousPage =
      page > 1 && attemptsQuery.data?.data.length === 1;

    try {
      await deleteMutation.mutateAsync({
        technicalEntryId: entry.id,
        attemptId,
      });
      setDeletingAttemptId(undefined);

      // Removing the only record on a later page would leave that page empty.
      if (shouldMoveToPreviousPage) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }
    } catch {
      // The mutation hook shows the API error; keep the dialog open for retry.
    }
  }

  async function onSubmit(values: AddSolutionAttemptFormOutput) {
    try {
      await addMutation.mutateAsync({
        technicalEntryId: entry.id,
        input: values,
      });
    } catch {
      // The mutation hook already shows the API error in a toast. Keeping the
      // fields populated lets the user retry without re-entering the attempt.
      return;
    }

    // Newest-first ordering puts the created attempt on page 1, so return
    // there after adding from any later page. Reset only after creation succeeds.
    setPage(1);
    form.reset();

    if (values.result === "SUCCESSFUL" && entry.status === "OPEN") {
      try {
        // The existing API resolution flow accepts the attempt text as the
        // conclusion, keeping the user's successful action and summary aligned.
        await resolveMutation.mutateAsync({
          technicalEntryId: entry.id,
          input: { conclusion: values.description },
        });
      } catch {
        // The attempt is already saved; the status dialog can retry closing it.
      }
    }
  }

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
      <header>
        <h2 className="font-semibold">Solution attempts</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {isResolved
            ? "Recorded attempts for this issue."
            : "Record what you tried and what happened."}
        </p>
      </header>

      {canAddAttempt ? (
        <Form {...form}>
          <form
            className="space-y-4 border-t border-border/60 pt-5"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you try?</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                      placeholder="Describe the change, command, or approach you tried."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <option value="">Select an outcome</option>
                      <option value="FAILED">Did not work</option>
                      <option value="PARTIAL">Partially worked</option>
                      <option value="SUCCESSFUL">Solved the issue</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Adding..." : "Add attempt"}
              </Button>
            </div>
          </form>
        </Form>
      ) : !isResolved ? (
        <p className="border-t border-border/60 pt-5 text-sm text-muted-foreground">
          This entry is archived. Restore it to add a solution attempt.
        </p>
      ) : null}

      <div className="border-t border-border/60 pt-5">
        {attemptsQuery.isPending ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading solution attempts...
          </p>
        ) : attemptsQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Could not load solution attempts. Try refreshing the page.
          </p>
        ) : attemptsQuery.data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No solution attempts have been recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-4">
              {attemptsQuery.data.data.map((attempt) => (
                <li
                  className="rounded-xl border border-border/60 bg-background/60 p-4"
                  key={attempt.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {resultLabels[attempt.result]}
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={attempt.createdAt}
                    >
                      {formatRelativeDate(attempt.createdAt)}
                    </time>
                  </div>
                  {editingAttemptId === attempt.id && !isResolved ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        aria-describedby={
                          descriptionError
                            ? `${attempt.id}-description-error`
                            : undefined
                        }
                        aria-invalid={Boolean(descriptionError)}
                        aria-label="Attempt description"
                        autoFocus
                        className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={updateMutation.isPending}
                        onChange={(event) => {
                          setDescriptionDraft(event.target.value);
                          setDescriptionError(undefined);
                        }}
                        value={descriptionDraft}
                      />
                      {descriptionError ? (
                        <p
                          className="text-sm text-destructive"
                          id={`${attempt.id}-description-error`}
                          role="alert"
                        >
                          {descriptionError}
                        </p>
                      ) : null}
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={updateMutation.isPending}
                          onClick={handleCancelEditing}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={updateMutation.isPending}
                          onClick={() => void handleSaveDescription(attempt.id)}
                          type="button"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {attempt.description}
                      </p>
                      {!isResolved ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            aria-label="Edit attempt description"
                            disabled={
                              updateMutation.isPending || deleteMutation.isPending
                            }
                            onClick={() => handleStartEditing(attempt)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil data-icon="inline-start" />
                            Edit
                          </Button>
                          <AlertDialog
                            onOpenChange={(open) =>
                              setDeletingAttemptId(open ? attempt.id : undefined)
                            }
                            open={deletingAttemptId === attempt.id}
                          >
                            <AlertDialogTrigger asChild>
                            <Button
                              aria-label="Delete solution attempt"
                              className="text-destructive hover:text-destructive"
                              disabled={
                                updateMutation.isPending ||
                                deleteMutation.isPending
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 data-icon="inline-start" />
                              Delete
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                                <AlertTriangle />
                              </AlertDialogMedia>
                              <AlertDialogTitle>
                                Delete this solution attempt?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This attempt will be permanently deleted. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                disabled={deleteMutation.isPending}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={deleteMutation.isPending}
                                onClick={(event) =>
                                  void handleDeleteAttempt(event, attempt.id)
                                }
                                variant="destructive"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="animate-spin" />
                                ) : null}
                                Delete permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <SolutionAttemptPagination
              isFetching={attemptsQuery.isFetching}
              meta={attemptsQuery.data.meta}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </section>
  );
}
