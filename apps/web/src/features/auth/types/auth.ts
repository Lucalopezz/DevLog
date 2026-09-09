import type { z } from 'zod'
import type { loginSchema } from '../schemas/login.schema'
import type { registerSchema } from '../schemas/register.schema'

export type User = {
  id: string
  name: string
  email: string
}

// Infers the form data type from the Zod schema
export type LoginFormData = z.infer<typeof loginSchema>

export type RegisterFormData = z.infer<typeof registerSchema>
