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
      toast.success('Project created successfully!')

      // The list can span multiple pages or use different filters.
      // Invalidating the list root lets React Query refetch only
      // relevant queries, keeping the server as the source of truth.
      await queryClient.invalidateQueries({
        queryKey: projectsKeys.lists(),
      })
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'Could not create the project. Try again.',
        ),
      )
    },
  })
}
