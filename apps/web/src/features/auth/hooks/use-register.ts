import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { registerUser } from '../api/register'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    // The mutation owns the POST and its pending state. Submit validated data
    // directly; a separate health request cannot guarantee this write succeeds.
    mutationFn: registerUser,
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
