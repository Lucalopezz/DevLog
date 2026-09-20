import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { useDeleteProjectResource } from "../hooks/use-project-resource-mutations";

export function ProjectResourceDeleteButton({
  disabled = false,
  onDeleted,
  projectId,
  resourceId,
  label,
}: {
  disabled?: boolean;
  onDeleted: () => void;
  projectId: string;
  resourceId: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteProjectResource();

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    // Keep confirmation visible if the request fails so the user can retry.
    event.preventDefault();
    try {
      await deleteMutation.mutateAsync({ projectId, resourceId });
      setOpen(false);
      onDeleted();
    } catch {
      // The mutation hook already reports the API error through a toast.
    }
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Delete ${label}`}
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
          <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
          <AlertDialogDescription>
            “{label}” will be permanently removed from this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Delete resource
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
