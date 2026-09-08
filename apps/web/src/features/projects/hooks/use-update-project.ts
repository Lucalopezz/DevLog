import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { getProjectQueryKey } from '../api/get-project'
import { projectsKeys } from '../api/list-projects'
import { updateProject } from '../api/update-project'
import type { UpdateProjectInput } from '../types/project'

export type UpdateProjectMutationInput = {
  projectId: string
  input: UpdateProjectInput
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, input }: UpdateProjectMutationInput) =>
      updateProject(projectId, input),

    onSuccess: async (_project, { projectId }) => {
      toast.success('Projeto atualizado com sucesso!')

      // A resposta do PATCH não inclui as coleções do detalhe, então deixamos
      // o GET reconstruir o recurso completo em vez de sobrescrever tecnologias
      // já presentes no cache com uma resposta parcial.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProjectQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectsKeys.lists(),
        }),
      ])
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'Não foi possível atualizar o projeto. Tente novamente.',
        ),
      )
    },
  })
}
