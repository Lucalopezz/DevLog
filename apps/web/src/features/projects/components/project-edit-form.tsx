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
 * Formulário dos dados gerais do projeto.
 *
 * O formulário mantém strings vazias para facilitar a edição. No submit, elas
 * viram `null`, pois esse é o sinal do contrato da API para limpar descrição ou
 * caminho local; omitir um campo teria o significado diferente de preservá-lo.
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
      // O hook já apresenta o erro via toast; o catch impede uma Promise
      // rejeitada não tratada no evento de submit.
    }
  }

  const isLoading =
    form.formState.isSubmitting || updateProjectMutation.isPending

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-6 border-border/60 bg-card p-7 shadow-2xl ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Editar projeto
          </DialogTitle>
          <DialogDescription className="leading-6">
            Atualize os dados gerais usados para identificar e organizar este projeto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            {/*
              Aqui o mesmo componente recebe outro `control`, criado por
              useProjectEditForm. Os campos compartilhados se comportam igual,
              mas o wrapper continua responsável pelo PATCH e por seus dados
              adicionais, status e localPath.
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
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                      <option value="FINISHED">Finalizado</option>
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
              label="Caminho local"
              name="localPath"
              placeholder="/workspace/meu-projeto"
            />

            <DialogFooter className="mx-0 mt-1 mb-0 border-t-0 bg-transparent p-0">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
