import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { login } from '../api/login'
import { currentUserQueryKey } from '../api/get-current-user'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useBackendConnection } from '@/app/providers/backend-connection-context'
import type { LoginFormData } from '../types/auth'

export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const connection = useBackendConnection()

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      // Zod has validated the form. Share the warmup round before sending the
      // credentials once; isPending includes this wait and blocks double clicks.
      if (!(await connection.ensureReady()))
        throw new Error('Connection unavailable.')
      return login(data)
    },
    retry: false,

    onSuccess: (user) => {
      toast.success('Signed in successfully!')
      // The login response already contains the profile. Seed the shared cache
      // before navigation so the private loader can reuse it immediately.
      queryClient.setQueryData(currentUserQueryKey, user)
      navigate('/dashboard', { replace: true })
    },

    onError: (error) => {
      // The hook owns operation feedback; the provider owns connection notices.
      // Neither resets the form, allowing a deliberate retry with the same input.
      toast.error(
        getApiErrorMessage(
          error,
          'Could not sign in. Check your credentials and try again.',
        ),
      )
    },
  })
}
