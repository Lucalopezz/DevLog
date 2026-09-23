import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
