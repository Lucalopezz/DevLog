import type { SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useProjectEditForm } from '../hooks/use-project-edit-form'
import { useUpdateProject } from '../hooks/use-update-project'
import type { Project, UpdateProjectFormValues } from '../types/project'
import { ProjectFormFields } from './project-form-fields'

export type ProjectEditFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

function nullableText(value: string) {
  const normalized = value.trim()
  return normalized || null
}

/**
 * Form for general project details.
 *
 * The form keeps empty strings to simplify editing. On submission, they
 * become `null`, the API contract signal to clear the description or
 * local path; omitting a field would instead preserve it.
 */
export function ProjectEditForm({
  open,
  onOpenChange,
  project,
}: ProjectEditFormProps) {
  const form = useProjectEditForm(project)
  const updateProjectMutation = useUpdateProject()

  const onSubmit: SubmitHandler<UpdateProjectFormValues> = async (data) => {
    try {
      await updateProjectMutation.mutateAsync({
        projectId: project.id,
        input: {
          name: data.name.trim(),
          description: nullableText(data.description),
          status: data.status,
          localPath: nullableText(data.localPath),
        },
      })
      onOpenChange(false)
    } catch {
      // The hook already displays errors in a toast; catch prevents an unhandled
      // Promise rejection in the submit event.
    }
  }

  const isLoading =
    form.formState.isSubmitting || updateProjectMutation.isPending

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Edit project
          </DialogTitle>
          <DialogDescription className="leading-6">
            Update the general details used to identify and organize this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/*
              Here the same component receives another `control`, created by
              useProjectEditForm. The shared fields behave the same way,
              but the wrapper remains responsible for PATCH and its additional
              fields, status and localPath.
            */}
            <ProjectFormFields
              control={form.control}
              disabled={isLoading}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="FINISHED">Finished</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormInput
              autoComplete="off"
              control={form.control}
              disabled={isLoading}
              label="Local path"
              name="localPath"
              placeholder="/workspace/my-project"
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
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
