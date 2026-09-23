import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { currentUserQueryKey } from '../api/get-current-user'
import { updateUser } from '../api/update-user'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (user) => {
      // The API returns the canonical user, so update the shared session query
      // immediately; the sidebar and account page then stay in sync.
      queryClient.setQueryData(currentUserQueryKey, user)
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update your profile. Try again.'))
    },
  })
}
