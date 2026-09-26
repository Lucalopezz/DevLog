import { useEffect } from "react";
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
  useCreateProjectEnvironment,
  useUpdateProjectEnvironment,
} from "../hooks/use-environments";
import {
  environmentFormSchema,
  toCreateEnvironmentInput,
  toUpdateEnvironmentInput,
  type EnvironmentFormValues,
} from "../schemas/environment.schema";
import { environmentCategoryLabel } from "../presentation";
import {
  environmentCategories,
  type ProjectEnvironment,
} from "../types/environment";

export function ProjectEnvironmentForm({
  environment,
  onOpenChange,
  onSaved,
  open,
  projectId,
}: {
  environment?: ProjectEnvironment;
  onOpenChange: (open: boolean) => void;
  onSaved: (wasCreated: boolean) => void;
  open: boolean;
  projectId: string;
}) {
  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(environmentFormSchema),
    defaultValues: {
      name: "",
      category: "LOCAL",
      operatingSystem: "",
      runtime: "",
      runtimeVersion: "",
      description: "",
    },
  });
  const createMutation = useCreateProjectEnvironment();
  const updateMutation = useUpdateProjectEnvironment();
  const { reset } = form;
  useEffect(() => {
    if (open)
      reset({
        name: environment?.name ?? "",
        category: environment?.category ?? "LOCAL",
        operatingSystem: environment?.operatingSystem ?? "",
        runtime: environment?.runtime ?? "",
        runtimeVersion: environment?.runtimeVersion ?? "",
        description: environment?.description ?? "",
      });
  }, [environment, open, reset]);

  const onSubmit: SubmitHandler<EnvironmentFormValues> = async (values) => {
    try {
      if (environment) {
        await updateMutation.mutateAsync({
          projectId,
          environmentId: environment.id,
          input: toUpdateEnvironmentInput(values),
        });
        onSaved(false);
      } else {
        await createMutation.mutateAsync({
          projectId,
          input: toCreateEnvironmentInput(values),
        });
        onSaved(true);
      }
      onOpenChange(false);
    } catch {
      // The mutation reports the API error; keep the draft visible for a retry.
    }
  };
  const isSaving =
    form.formState.isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;
  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {environment ? "Edit environment" : "New environment"}
          </DialogTitle>
          <DialogDescription>
            Record where this project runs and its runtime conditions. Do not
            enter secrets.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-5"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormInput
              control={form.control}
              disabled={isSaving}
              label="Name"
              name="name"
              placeholder="Local development"
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      disabled={isSaving}
                    >
                      {environmentCategories.map((category) => (
                        <option key={category} value={category}>
                          {environmentCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                control={form.control}
                disabled={isSaving}
                label="Operating system"
                name="operatingSystem"
                placeholder="Ubuntu 24.04"
              />
              <FormInput
                control={form.control}
                disabled={isSaving}
                label="Runtime"
                name="runtime"
                placeholder="Node.js"
              />
            </div>
            <FormInput
              control={form.control}
              disabled={isSaving}
              label="Runtime version"
              name="runtimeVersion"
              placeholder="22"
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      disabled={isSaving}
                      placeholder="Relevant setup details without credentials"
                    />
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
              <Button aria-live="polite" disabled={isSaving} type="submit">
                {isSaving
                  ? "Saving..."
                  : environment
                    ? "Save changes"
                    : "Create environment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
