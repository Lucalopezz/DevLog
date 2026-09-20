import { useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";
import {
  useCreateProjectResource,
  useUpdateProjectResource,
} from "../hooks/use-project-resource-mutations";
import { useProjectResourceForm } from "../hooks/use-project-resource-form";
import type { ProjectResourceFormValues } from "../schemas/project-resource.schema";
import type { ProjectResource, ProjectResourceInput } from "../types/project-detail";

export function ProjectResourceForm({
  onOpenChange,
  onSaved,
  open,
  projectId,
  resource,
}: {
  onOpenChange: (open: boolean) => void;
  onSaved: (wasCreated: boolean) => void;
  open: boolean;
  projectId: string;
  resource?: ProjectResource;
}) {
  const form = useProjectResourceForm(resource);
  const createMutation = useCreateProjectResource();
  const updateMutation = useUpdateProjectResource();
  const { reset } = form;
  const isEditing = Boolean(resource);

  // This dialog serves both create and edit. Reset from the selected resource
  // each time it opens so form state cannot carry over from another record.
  useEffect(() => {
    if (open) {
      reset({
        label: resource?.label ?? "",
        url: resource?.url ?? "",
        type: resource?.type ?? "OTHER",
      });
    }
  }, [open, reset, resource]);

  const onSubmit: SubmitHandler<ProjectResourceFormValues> = async (values) => {
    const input: ProjectResourceInput = {
      label: values.label,
      url: values.url,
      type: values.type,
    };

    try {
      if (resource) {
        await updateMutation.mutateAsync({
          projectId,
          resourceId: resource.id,
          input,
        });
        onSaved(false);
      } else {
        await createMutation.mutateAsync({ projectId, input });
        onSaved(true);
      }
      onOpenChange(false);
    } catch {
      // Mutation hooks show API errors; leaving the dialog open allows a retry.
    }
  };

  const isSaving =
    form.formState.isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit resource" : "New resource"}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Save a project link with a label and resource type.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-5"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isSaving}
              label="Label"
              name="label"
              placeholder="Project repository"
            />

            <FormInput
              autoComplete="url"
              control={form.control}
              disabled={isSaving}
              label="URL"
              name="url"
              placeholder="https://github.com/owner/project"
              type="url"
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
                      disabled={isSaving}
                    >
                      <option value="REPOSITORY">Repository</option>
                      <option value="DOCUMENTATION">Documentation</option>
                      <option value="LOCAL_URL">Local URL</option>
                      <option value="EXTERNAL_URL">External link</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create resource"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
