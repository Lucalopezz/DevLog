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
import { useRestoreProject } from "../hooks/use-project-lifecycle";

export function RestoreProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const restoreMutation = useRestoreProject();

  async function handleRestore(event: MouseEvent<HTMLButtonElement>) {
    // Keep the confirmation open when the request fails so the user can retry.
    event.preventDefault();
    try {
      await restoreMutation.mutateAsync(projectId);
      setOpen(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open lets the user retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <RotateCcw data-icon="inline-start" />
          Restore project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RotateCcw />
          </AlertDialogMedia>
          <AlertDialogTitle>Restore this project?</AlertDialogTitle>
          <AlertDialogDescription>
            The project will become editable again and return to the default
            project list.
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
            Restore project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
