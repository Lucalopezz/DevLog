import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { registerUser } from '../api/register'
import { useBackendConnection } from '@/app/providers/backend-connection-context'
import type { RegisterFormData } from '../types/auth'

export function useRegister() {
  const navigate = useNavigate()
  const connection = useBackendConnection()

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Validation has already produced RegisterFormData. Readiness belongs
      // inside the mutation so its pending state covers both warmup and the POST.
      if (!(await connection.ensureReady()))
        throw new Error('Connection unavailable.')
      return registerUser(data)
    },
    // Creating an account changes server state. Even after recovery, a lost
    // response must not cause this POST to be sent again automatically.
    retry: false,
    onSuccess: () => {
      // Registration does not authenticate automatically; the user must sign in
      // through the login screen to receive the session cookie.
      toast.success('Account created successfully! Sign in to continue.')
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Could not create your account. Try again.'),
      )
    },
  })
}
