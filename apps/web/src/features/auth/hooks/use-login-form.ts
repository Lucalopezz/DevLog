import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema } from '@/features/auth/login.schema'
import type { LoginFormData } from '@/features/auth/types'


/**
 *
 * Retorna o objeto de configuração do React Hook Form para o formulário de login.
 * É passado por parâmetro para o componente de form do shadcn, que cuida da integração com o React Hook Form.
 * */
export function useLoginForm() {
  return useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
}
