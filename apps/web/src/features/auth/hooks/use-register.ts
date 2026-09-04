import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { registerUser } from '../api/register'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // O cadastro não autentica automaticamente; o usuário deve entrar
      // pela tela de login para receber o cookie de sessão.
      navigate('/login', { replace: true })
    },
  })
}
