import type { SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTechnicalEntryTitleForm } from "../hooks/use-technical-entry-form";
import { useUpdateTechnicalEntry } from "../hooks/use-update-technical-entry";
import type { UpdateTechnicalEntryTitleFormValues } from "../schemas/technical-entry.schema";
import type { TechnicalEntry } from "../types/technical-entry";

type Props = {
  entry: TechnicalEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog wrapper for the technical entry title.
 *
 * Long-form content has its own inline editor on the detail page. Separating
 * the title form from the content editor makes each interaction smaller and
 * avoids making the user search through a modal to edit a paragraph.
 */
export function TechnicalEntryEditForm({
  entry,
  open,
  onOpenChange,
}: Props) {
  const form = useTechnicalEntryTitleForm(entry);
  const updateMutation = useUpdateTechnicalEntry();

  const onSubmit: SubmitHandler<UpdateTechnicalEntryTitleFormValues> = async (
    data,
  ) => {
    try {
      await updateMutation.mutateAsync({
        technicalEntryId: entry.id,
        input: {
          title: data.title,
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
            Update the title of this entry.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isLoading}
              label="Title"
              name="title"
              placeholder="Unable to connect to the database"
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
