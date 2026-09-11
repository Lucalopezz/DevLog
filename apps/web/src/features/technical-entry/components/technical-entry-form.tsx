import type { SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateTechnicalEntry } from "../hooks/use-create-technical-entry";
import { useTechnicalEntryForm } from "../hooks/use-technical-entry-form";
import type { CreateTechnicalEntryFormValues } from "../schemas/technical-entry.schema";
import type { CreateTechnicalEntryInput } from "../types/technical-entry";
import { TechnicalEntryFormFields } from "./technical-entry-form-fields";

export type TechnicalEntryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
};

function optionalText(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

/**
 * Container for creating an entry from either a project page or the global
 * technical-entry list.
 *
 * The project ID comes from the page context instead of a user-editable field.
 * This keeps the relationship explicit and prevents accidentally creating an
 * entry in a different project from this modal. When the global list opens the
 * form, the API receives no projectId and creates an unlinked entry.
 */
export function TechnicalEntryForm({
  open,
  onOpenChange,
  projectId,
}: TechnicalEntryFormProps) {
  const form = useTechnicalEntryForm();
  const createMutation = useCreateTechnicalEntry();

  const onSubmit: SubmitHandler<CreateTechnicalEntryFormValues> = async (
    data,
  ) => {
    const conclusion = optionalText(data.conclusion ?? "");
    const input: CreateTechnicalEntryInput = {
      title: data.title,
      context: data.context,
      type: data.type,
      ...(projectId ? { projectId } : {}),
      ...(conclusion ? { conclusion } : {}),
    };

    try {
      // handleSubmit has already run the Zod resolver before this callback.
      await createMutation.mutateAsync(input);
      form.reset();
      onOpenChange(false);
    } catch {
      // The mutation hook displays the API error in a toast. Catching here
      // prevents an unhandled rejection from the submit event.
    }
  };

  const isLoading = form.formState.isSubmitting || createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            New technical entry
          </DialogTitle>
          <DialogDescription className="leading-6">
            Record an issue or lesson learned.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <TechnicalEntryFormFields<CreateTechnicalEntryFormValues>
              control={form.control}
              disabled={isLoading}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="ISSUE">Issue</option>
                      <option value="LEARNING">Learning</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                {isLoading ? "Creating..." : "Create entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
