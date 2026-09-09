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
      toast.success('Project updated successfully!')

      // The PATCH response omits the detail collections, so let
      // GET rebuild the complete resource to avoid overwriting technologies
      // already in the cache with a partial response.
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
          'Could not update the project. Try again.',
        ),
      )
    },
  })
}
