import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { registerUser } from '../api/register'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Registration does not authenticate automatically; the user must sign in
      // through the login screen to receive the session cookie.
      toast.success('Account created successfully! Sign in to continue.')
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'Could not create your account. Try again.',
        ),
      )
    },
  })
}
