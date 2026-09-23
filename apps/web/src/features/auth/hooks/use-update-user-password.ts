import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { updateUserPassword } from '../api/update-user-password'

export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: updateUserPassword,
    onSuccess: () => {
      toast.success('Password updated successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not update your password. Try again.'))
    },
  })
}
