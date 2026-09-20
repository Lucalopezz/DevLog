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
  useCreateProjectCommand,
  useUpdateProjectCommand,
} from "../hooks/use-project-command-mutations";
import { useProjectCommandForm } from "../hooks/use-project-command-form";
import type { ProjectCommandFormValues } from "../schemas/project-command.schema";
import type {
  ProjectCommand,
  ProjectCommandInput,
  UpdateProjectCommandInput,
} from "../types/project-detail";

export function ProjectCommandForm({
  command,
  onOpenChange,
  onSaved,
  open,
  projectId,
}: {
  command?: ProjectCommand;
  onOpenChange: (open: boolean) => void;
  onSaved: (wasCreated: boolean) => void;
  open: boolean;
  projectId: string;
}) {
  const form = useProjectCommandForm(command);
  const createMutation = useCreateProjectCommand();
  const updateMutation = useUpdateProjectCommand();
  const { reset } = form;
  const isEditing = Boolean(command);

  // Reset on open so a previous draft never leaks into the next command edited.
  useEffect(() => {
    if (open) {
      reset({
        title: command?.title ?? "",
        command: command?.command ?? "",
        description: command?.description ?? "",
        executionOrder: command?.executionOrder?.toString() ?? "",
      });
    }
  }, [command, open, reset]);

  const onSubmit: SubmitHandler<ProjectCommandFormValues> = async (values) => {
    const description = values.description.trim();
    const executionOrder = values.executionOrder === ""
      ? undefined
      : Number(values.executionOrder);

    try {
      if (command) {
        const input: UpdateProjectCommandInput = {
          title: values.title,
          command: values.command,
          // PATCH uses null to clear optional values that were previously saved.
          description: description || null,
          executionOrder: executionOrder ?? null,
        };
        await updateMutation.mutateAsync({ projectId, commandId: command.id, input });
        onSaved(false);
      } else {
        const input: ProjectCommandInput = {
          title: values.title,
          command: values.command,
          ...(description ? { description } : {}),
          ...(executionOrder !== undefined ? { executionOrder } : {}),
        };
        await createMutation.mutateAsync({ projectId, input });
        onSaved(true);
      }
      onOpenChange(false);
    } catch {
      // The mutation owns the toast; keeping the dialog open allows a retry.
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
            {isEditing ? "Edit command" : "New command"}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Save a reusable command with an optional description and execution order.
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
              label="Title"
              name="title"
              placeholder="Install dependencies"
            />

            <FormField
              control={form.control}
              name="command"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving}
                      placeholder="pnpm install"
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                      className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving}
                      placeholder="Install the project dependencies."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isSaving}
              inputMode="numeric"
              label="Execution order"
              min={0}
              name="executionOrder"
              placeholder="Optional"
              step={1}
              type="number"
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
                    : "Create command"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
