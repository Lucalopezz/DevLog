import type { z } from 'zod'
import type { loginSchema } from './login.schema'

export type User = {
  id: string
  name: string
  email: string
}

export type LoginFormData = z.infer<typeof loginSchema>
