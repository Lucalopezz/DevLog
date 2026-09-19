import { useState } from "react";
import { useAddSolutionAttempt } from "../hooks/use-add-solution-attempt";
import { useAddSolutionAttemptForm } from "../hooks/use-add-solution-attempt-form";
import { useSolutionAttempts } from "../hooks/use-solution-attempt";
import { SolutionAttemptPagination } from "./solution-attempt-pagination";
import type { AddSolutionAttemptFormOutput } from "../schemas/solution-attempt.schema";
import type { TechnicalEntry } from "../types/technical-entry";
import type { SolutionAttemptResult } from "../types/solution-attempt";
import { formatRelativeDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
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
  const attemptsQuery = useSolutionAttempts(entry.id, { page });
  const addMutation = useAddSolutionAttempt();
  const form = useAddSolutionAttemptForm();

  const canAddAttempt = !entry.archivedAt;
  const isSubmitting = form.formState.isSubmitting || addMutation.isPending;

  async function onSubmit(values: AddSolutionAttemptFormOutput) {
    try {
      await addMutation.mutateAsync({
        technicalEntryId: entry.id,
        input: values,
      });

      // Newest-first ordering puts the created attempt on page 1, so return
      // there after adding from any later page.
      setPage(1);

      // Reset the form only after the API confirms the attempt was created.
      form.reset();
    } catch {
      // The mutation hook already shows the API error in a toast. Keeping the
      // fields populated lets the user retry without re-entering the attempt.
    }
  }

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
      <header>
        <h2 className="font-semibold">Solution attempts</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Record what you tried and what happened.
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
      ) : (
        <p className="border-t border-border/60 pt-5 text-sm text-muted-foreground">
          This entry is archived. Restore it to add a solution attempt.
        </p>
      )}

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
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {attempt.description}
                  </p>
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
