import type { SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTechnicalEntryEditForm } from "../hooks/use-technical-entry-form";
import { useUpdateTechnicalEntry } from "../hooks/use-update-technical-entry";
import type { UpdateTechnicalEntryFormValues } from "../schemas/technical-entry.schema";
import type { TechnicalEntry } from "../types/technical-entry";
import { TechnicalEntryFormFields } from "./technical-entry-form-fields";

type Props = {
  entry: TechnicalEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function nullableText(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

/**
 * Edit wrapper for the shared technical-entry fields.
 *
 * The type is intentionally not rendered here: the PATCH contract does not
 * allow changing ISSUE into LEARNING or vice versa. Status is also controlled
 * by the resolve/reopen actions, not by this general-details form.
 */
export function TechnicalEntryEditForm({
  entry,
  open,
  onOpenChange,
}: Props) {
  const form = useTechnicalEntryEditForm(entry);
  const updateMutation = useUpdateTechnicalEntry();

  const onSubmit: SubmitHandler<UpdateTechnicalEntryFormValues> = async (
    data,
  ) => {
    try {
      await updateMutation.mutateAsync({
        technicalEntryId: entry.id,
        input: {
          title: data.title,
          context: data.context,
          conclusion: nullableText(data.conclusion),
        },
      });
      onOpenChange(false);
    } catch {
      // The mutation hook already displays the API error in a toast.
    }
  };

  const isLoading =
    form.formState.isSubmitting || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Edit technical entry
          </DialogTitle>
          <DialogDescription className="leading-6">
            Update the title, context, or conclusion of this entry.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <TechnicalEntryFormFields<UpdateTechnicalEntryFormValues>
              control={form.control}
              disabled={isLoading}
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
