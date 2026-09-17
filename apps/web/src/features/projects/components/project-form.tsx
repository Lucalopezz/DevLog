import type { SubmitHandler } from "react-hook-form";
import type { RefObject } from "react";

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
import { useCreateProject } from "../hooks/use-create-project";
import { useProjectForm } from "../hooks/use-project-form";
import { ProjectFormFields } from "./project-form-fields";
import type { CreateProjectInput } from "../types/project";

export type ProjectFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
};

/**
 * Form responsible for the project creation interface.
 *
 * useProjectForm configures React Hook Form and Zod; the mutation handles
 * the HTTP call and global effects, such as toasts and cache invalidation.
 * This component therefore only connects fields to the submission flow.
 */
export function ProjectForm({ open, onOpenChange, triggerRef }: ProjectFormProps) {
  const form = useProjectForm();
  const createProjectMutation = useCreateProject();

  const { handleSubmit } = form;

  const onSubmit: SubmitHandler<CreateProjectInput> = async (data) => {
    try {
      // handleSubmit calls this function only after resolver validation.
      await createProjectMutation.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch {
      // The mutation hook already displays errors in a toast; catch prevents an
      // unhandled Promise rejection in the submit event.
    }
  };

  const isLoading =
    form.formState.isSubmitting || createProjectMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          // This controlled dialog has no DialogTrigger for Radix to refocus.
          // Restore the keyboard user's position in the project list instead.
          if (triggerRef?.current) {
            event.preventDefault();
            triggerRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            New project
          </DialogTitle>
          <DialogDescription className="leading-6">
            Create a project to organize it in DevLog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            {/*
              The creation wrapper provides `form.control` configured by
              useProjectForm. ProjectFormFields only renders and connects name
              and description; it does not know the final operation will be a POST.
            */}
            <ProjectFormFields
              control={form.control}
              disabled={isLoading}
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button disabled={isLoading} type="submit">
                {isLoading ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
