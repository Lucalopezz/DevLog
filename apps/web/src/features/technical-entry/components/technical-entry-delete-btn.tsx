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
import { useDeleteTechnicalEntry } from "../hooks/use-delete-technical-entry";

export function DeleteTechnicalEntryButton({
  technicalEntryId,
  title,
}: {
  technicalEntryId: string;
  title: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteTechnicalEntry();

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    try {
      await deleteMutation.mutateAsync(technicalEntryId);
      setOpen(false);
      navigate("/technical-entries");
    } catch {
      // The mutation owns the toast; keeping the dialog open allows a retry.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" type="button" variant="destructive">
          <Trash2 data-icon="inline-start" />
          Delete entry
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this technical entry?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” will be permanently deleted. This action cannot be undone.
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
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
