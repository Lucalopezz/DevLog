import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";
import { useAddProjectTechnology } from "../hooks/use-project-technology-mutations";
import {
  projectTechnologySchema,
  type ProjectTechnologyFormValues,
} from "../schemas/project-technology.schema";

export function ProjectTechnologyForm({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}) {
  const form = useForm<ProjectTechnologyFormValues>({
    resolver: zodResolver(projectTechnologySchema),
    defaultValues: { name: "", version: "" },
  });
  const addMutation = useAddProjectTechnology(projectId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isLoading) form.reset();
    onOpenChange(nextOpen);
  }

  const onSubmit: SubmitHandler<ProjectTechnologyFormValues> = async (
    values,
  ) => {
    try {
      // Blank optional versions are omitted so the API stores no empty string.
      await addMutation.mutateAsync({
        name: values.name,
        ...(values.version?.trim() ? { version: values.version.trim() } : {}),
      });
      form.reset();
      onOpenChange(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open allows a retry.
    }
  };

  const isLoading = form.formState.isSubmitting || addMutation.isPending;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Add a technology
          </DialogTitle>
          <DialogDescription className="leading-6">
            Record a language, framework, database, or tool used by this
            project.
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
              placeholder="React"
            />
            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isLoading}
              label="Version (optional)"
              name="version"
              placeholder="19"
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button
                disabled={isLoading}
                onClick={() => handleOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Adding..." : "Add technology"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
