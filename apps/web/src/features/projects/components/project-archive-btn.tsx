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
import { useArchiveProject } from "../hooks/use-project-lifecycle";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const archiveMutation = useArchiveProject();

  async function handleArchive(event: MouseEvent<HTMLButtonElement>) {
    // Keep the confirmation open when the request fails so the user can retry.
    event.preventDefault();
    try {
      await archiveMutation.mutateAsync(projectId);
      setOpen(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open lets the user retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Archive data-icon="inline-start" />
          Archive project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Archive />
          </AlertDialogMedia>
          <AlertDialogTitle>Archive this project?</AlertDialogTitle>
          <AlertDialogDescription>
            The project will become read-only and disappear from the default
            project list. You can restore it later.
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
            Archive project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
