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
      // O cadastro não autentica automaticamente; o usuário deve entrar
      // pela tela de login para receber o cookie de sessão.
      toast.success('Conta criada com sucesso! Faça login para continuar.')
      navigate('/login', { replace: true })
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          'Não foi possível criar a conta. Tente novamente.',
        ),
      )
    },
  })
}
