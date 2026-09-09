import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters long.'),
    email: z.email('Enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })
