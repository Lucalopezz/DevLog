import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema } from '@/features/auth/schemas/login.schema'
import type { LoginFormData } from '@/features/auth/types/auth'


/**
 *
 * Returns the React Hook Form configuration object for the login form.
 * Passed to the shadcn form component, which handles React Hook Form integration.
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
