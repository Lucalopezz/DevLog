import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
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
import { Input } from "@/components/ui/input";
import { useDeleteProject } from "../hooks/use-project-lifecycle";

export function DeleteProjectButton({
  disabled = false,
  projectId,
  projectName,
}: {
  disabled?: boolean;
  projectId: string;
  projectName: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const deleteMutation = useDeleteProject();
  const canDelete = confirmation.trim() === projectName;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setConfirmation("");
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    // The action closes AlertDialog by default; defer that until the API succeeds.
    event.preventDefault();
    try {
      await deleteMutation.mutateAsync(projectId);
      setOpen(false);
      navigate("/projects");
    } catch {
      // The mutation owns the toast; keeping the dialog open lets the user retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled} size="sm" type="button" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Delete project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this project permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the project, its commands, resources, and technologies.
            Technical entries will remain but will no longer be linked to it.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="project-delete-confirmation"
          >
            Type <span className="font-semibold">{projectName}</span> to confirm
          </label>
          <Input
            autoComplete="off"
            id="project-delete-confirmation"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={projectName}
            value={confirmation}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!canDelete || deleteMutation.isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
