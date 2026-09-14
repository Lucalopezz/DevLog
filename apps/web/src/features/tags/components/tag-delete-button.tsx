import { Loader2, Trash2 } from "lucide-react";
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
import type { Tag } from "../types/tag";

type TagDeleteButtonProps = {
  isPending: boolean;
  onDelete: () => Promise<void>;
  tag: Tag;
};

export function TagDeleteButton({
  isPending,
  onDelete,
  tag,
}: TagDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the request succeeds so the user can retry
    // when the API reports an error.
    event.preventDefault();

    try {
      await onDelete();
      setOpen(false);
    } catch {
      // The mutation owns the error toast.
    }
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Delete ${tag.name} tag`}
          disabled={isPending}
          size="icon"
          type="button"
          variant="ghost"
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes <strong>#{tag.name}</strong> from your tag library and
            its associations with technical entries.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Delete tag
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
