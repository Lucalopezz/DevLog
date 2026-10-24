import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { login } from '../api/login'
import { currentUserQueryKey } from '../api/get-current-user'
import { getApiErrorMessage } from '@/lib/get-api-error-message'

export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    // The mutation owns the POST and its pending state. Submit validated data
    // directly; a separate health request cannot guarantee this write succeeds.
    mutationFn: login,
    retry: false,

    onSuccess: (user) => {
      toast.success('Signed in successfully!')
      // The login response already contains the profile. Seed the shared cache
      // before navigation so the private loader can reuse it immediately.
      queryClient.setQueryData(currentUserQueryKey, user)
      navigate('/dashboard', { replace: true })
    },

    onError: (error) => {
      // Keep entered values available so the user can deliberately retry.
      toast.error(
        getApiErrorMessage(
          error,
          'Could not sign in. Check your credentials and try again.',
        ),
      )
    },
  })
}
