import type { z } from 'zod'
import type { loginSchema } from './login.schema'

export type User = {
  id: string
  name: string
  email: string
}

// Infere o tipo de dados do formulário a partir do schema do Zod
export type LoginFormData = z.infer<typeof loginSchema>
