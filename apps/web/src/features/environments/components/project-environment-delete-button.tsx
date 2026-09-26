import { useState, type MouseEvent } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { useDeleteProjectEnvironment } from "../hooks/use-environments";

export function ProjectEnvironmentDeleteButton({
  disabled,
  environmentId,
  name,
  onDeleted,
  projectId,
}: {
  disabled: boolean;
  environmentId: string;
  name: string;
  onDeleted: () => void;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useDeleteProjectEnvironment();
  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({ projectId, environmentId });
      setOpen(false);
      onDeleted();
    } catch {
      // Keep the confirmation open after a failed request for another attempt.
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Delete ${name}`}
          disabled={disabled}
          size="sm"
          type="button"
          variant="outline"
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
          <AlertDialogTitle>Delete this environment?</AlertDialogTitle>
          <AlertDialogDescription>
            “{name}” will be permanently removed from this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Delete environment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
