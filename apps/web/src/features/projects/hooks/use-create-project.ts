import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { createProject } from '../api/create-project'
import { projectsKeys } from '../api/list-projects'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,

    onSuccess: async () => {
      toast.success('Projeto criado com sucesso!')

      // A lista pode estar em várias páginas ou com filtros diferentes.
      // Invalidar a raiz das listas permite que o React Query refaça somente
      // as consultas relevantes, mantendo o servidor como fonte da verdade.
      await queryClient.invalidateQueries({
        queryKey: projectsKeys.lists(),
      })
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'Não foi possível criar o projeto. Tente novamente.',
        ),
      )
    },
  })
}
