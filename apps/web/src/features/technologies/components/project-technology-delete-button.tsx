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

export function ProjectTechnologyDeleteButton({
  disabled = false,
  isPending,
  name,
  onDelete,
}: {
  isPending: boolean;
  disabled?: boolean;
  name: string;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  async function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    try {
      await onDelete();
      setOpen(false);
    } catch {
      // Keep the confirmation open so a failed request can be retried.
    }
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={`Remove ${name} from this project`}
          disabled={disabled || isPending}
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
          <AlertDialogTitle>Remove this technology?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes <strong>{name}</strong> from this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disabled || isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled || isPending}
            onClick={handleDelete}
            variant="destructive"
          >
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Remove technology
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
