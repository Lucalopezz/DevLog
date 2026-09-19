import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useReopenTechnicalIssue,
  useResolveTechnicalIssue,
} from "../hooks/use-technical-entry-lifecycle";
import { resolveTechnicalIssueSchema } from "../schemas/technical-entry.schema";
import type { ResolveTechnicalIssueFormValues } from "../schemas/technical-entry.schema";
import type { TechnicalEntry } from "../types/technical-entry";

type Props = {
  entry: TechnicalEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TechnicalEntryStatusDialog({
  entry,
  open,
  onOpenChange,
}: Props) {
  // If the entry is open, the dialog will show a form to resolve it. If the entry is closed, the dialog will show a confirmation to reopen it.
  const isOpen = entry.status === "OPEN";
  const resolveMutation = useResolveTechnicalIssue();
  const reopenMutation = useReopenTechnicalIssue();
  const form = useForm<ResolveTechnicalIssueFormValues>({
    resolver: zodResolver(resolveTechnicalIssueSchema),
    defaultValues: { conclusion: entry.conclusion ?? "" },
  });
  const resetForm = form.reset;
  const isPending = resolveMutation.isPending || reopenMutation.isPending;

  // UseEffect to reset the form when the dialog is opened, so that the conclusion field is pre-filled with
  // the existing conclusion if the issue has been reopened and closed again.
  useEffect(() => {
    if (open) {
      // Reuse an existing conclusion when an issue has been reopened and closed again.
      resetForm({ conclusion: entry.conclusion ?? "" });
    }
  }, [entry.conclusion, entry.id, open, resetForm]);

  async function handleResolve(values: ResolveTechnicalIssueFormValues) {
    try {
      await resolveMutation.mutateAsync({
        technicalEntryId: entry.id,
        input: values,
      });
      onOpenChange(false);
    } catch {
      // The mutation toast reports the failure; keep the form open for retry.
    }
  }

  async function handleReopen() {
    try {
      await reopenMutation.mutateAsync(entry.id);
      onOpenChange(false);
    } catch {
      // Keep the confirmation open so the user can retry after a server error.
    }
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isOpen ? "Close this issue" : "Reopen this issue"}
          </DialogTitle>
          <DialogDescription className="leading-6">
            {isOpen
              ? "Record the conclusion that resolved the issue. A successful solution attempt closes it automatically using the attempt description."
              : "The issue will return to your open list. Its conclusion and solution attempts will remain in the history."}
          </DialogDescription>
        </DialogHeader>

        {isOpen ? (
          <Form {...form}>
            <form
              className="space-y-6"
              noValidate
              onSubmit={form.handleSubmit(handleResolve)}
            >
              <FormField
                control={form.control}
                name="conclusion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conclusion</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        autoFocus
                        className="min-h-32 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isPending}
                        placeholder="What resolved the issue?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
                <Button
                  disabled={isPending}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={isPending} type="submit">
                  {resolveMutation.isPending ? "Closing..." : "Close issue"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void handleReopen()}
              type="button"
            >
              {reopenMutation.isPending ? "Reopening..." : "Reopen issue"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
