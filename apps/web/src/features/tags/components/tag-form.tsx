import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useCreateTag } from "../hooks/use-create-tag";
import { tagSchema, type TagFormValues } from "../schemas/tag.schema";
import type { Tag } from "../types/tag";

type TagFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (tag: Tag) => void;
};

export function TagForm({ onCreated, open, onOpenChange }: TagFormProps) {
  // The form owns field state and client validation; the mutation owns the
  // request, toast feedback, and cache invalidation.
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "" },
  });
  const createMutation = useCreateTag();

  const onSubmit: SubmitHandler<TagFormValues> = async (data) => {
    try {
      const tag = await createMutation.mutateAsync(data);

      // Consumers such as TagSelector need the new ID immediately, before the
      // invalidated tag query finishes refetching in the background.
      onCreated?.(tag);
      form.reset();
      onOpenChange(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open allows retrying.
    }
  };

  const isLoading = form.formState.isSubmitting || createMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            New tag
          </DialogTitle>
          <DialogDescription className="leading-6">
            Create a reusable tag for your technical knowledge.
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
              label="Name"
              name="name"
              placeholder="PostgreSQL"
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
                {isLoading ? "Creating..." : "Create tag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
