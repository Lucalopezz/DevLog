import { Archive, Loader2 } from "lucide-react";
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
import { useArchiveTechnicalEntry } from "../hooks/use-technical-entry-lifecycle";

export function ArchiveTechnicalEntryButton({
  technicalEntryId,
}: {
  technicalEntryId: string;
}) {
  const [open, setOpen] = useState(false);
  const archiveMutation = useArchiveTechnicalEntry();

  async function handleArchive(event: MouseEvent<HTMLButtonElement>) {
    // Keep the confirmation open when the request fails so the user can retry.
    event.preventDefault();

    try {
      await archiveMutation.mutateAsync(technicalEntryId);
      setOpen(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open allows a retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Archive data-icon="inline-start" />
          Archive entry
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Archive />
          </AlertDialogMedia>
          <AlertDialogTitle>Archive this technical entry?</AlertDialogTitle>
          <AlertDialogDescription>
            The entry will disappear from the default lists without losing its
            history. You can restore it later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={archiveMutation.isPending}
            onClick={handleArchive}
          >
            {archiveMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Archive entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
