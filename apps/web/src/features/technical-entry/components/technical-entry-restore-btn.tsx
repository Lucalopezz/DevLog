import { Loader2, RotateCcw } from "lucide-react";
import { useState, type MouseEvent } from "react";
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
import { Button } from "@/components/ui/button";
import { useRestoreTechnicalEntry } from "../hooks/use-technical-entry-lifecycle";

export function RestoreTechnicalEntryButton({
  technicalEntryId,
}: {
  technicalEntryId: string;
}) {
  const [open, setOpen] = useState(false);
  const restoreMutation = useRestoreTechnicalEntry();

  async function handleRestore(event: MouseEvent<HTMLButtonElement>) {
    // Keep the confirmation open when the request fails so the user can retry.
    event.preventDefault();

    try {
      await restoreMutation.mutateAsync(technicalEntryId);
      setOpen(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open allows a retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <RotateCcw data-icon="inline-start" />
          Restore entry
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RotateCcw />
          </AlertDialogMedia>
          <AlertDialogTitle>Restore this technical entry?</AlertDialogTitle>
          <AlertDialogDescription>
            The entry will return to the default technical-entry lists.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={restoreMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={restoreMutation.isPending}
            onClick={handleRestore}
          >
            {restoreMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Restore entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
